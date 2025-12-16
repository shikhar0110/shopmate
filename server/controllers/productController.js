import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";

import { getAIRecommendation } from "../utils/getAIRecommendation.js";

export const createProduct = catchAsyncErrors(async(req,res,next)=>{
    const {name,description,price,category,stock}=req.body;
    const created_by=req.user.id;
    if(!name || !description || !price || !category || !stock){
        return next(new ErrorHandler("Please enter all fields",400));
    }
        let uploadedImage = [];
        const images =
            req.files?.images
                ? Array.isArray(req.files.images)
                    ? req.files.images
                    : [req.files.images]
                : req.body.images
                ? Array.isArray(req.body.images)
                    ? req.body.images
                    : [req.body.images]
                : [];

        for (const image of images) {
            const imagePath = image?.tempFilePath || image;
            const result = await cloudinary.uploader.upload(imagePath, {
                folder:"Ecommerce_Products_Images",
                width:1000,
                crop:"scale"

            })
            uploadedImage.push({
                url:result.secure_url,
                public_id:result.public_id,
            })
        }
    
    const product=await database.query(
        `INSERT INTO products (name,description,price,category,stock,created_by,images)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
         [name,description,price,category,stock,created_by,JSON.stringify(uploadedImage)]
    );
    res.status(201).json({
        success:true,
        product:product.rows[0],
        message:"Product created successfully"
    })

})


export const fetchAllProducts = catchAsyncErrors(async (req, res, next) => {
  // Normalize query keys and trim values so requests like `?category =xyz` still work
  const normalizedQuery = Object.fromEntries(
    Object.entries(req.query || {}).map(([k, v]) => [k.trim(), typeof v === 'string' ? v.trim() : v])
  );
  const { availability, price, category, ratings, search } = normalizedQuery;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const conditions = [];
  let values = [];
  let index = 1;

  let paginationPlaceholders = {};

  // Filter products by availability
  if (availability === "in-stock") {
    conditions.push(`stock > 5`);
  } else if (availability === "limited") {
    conditions.push(`stock > 0 AND stock <= 5`);
  } else if (availability === "out-of-stock") {
    conditions.push(`stock = 0`);
  }

  // Filter products by price
  if (price) {
    const [minPrice, maxPrice] = price.split("-");
    if (minPrice && maxPrice) {
      conditions.push(`price BETWEEN $${index} AND $${index + 1}`);
      values.push(minPrice, maxPrice);
      index += 2;
    }
  }

  // Filter products by category
  if (category) {
    conditions.push(`category ILIKE $${index}`);
    values.push(`%${category}%`);
    index++;
  }

  // Filter products by rating
  if (ratings) {
    conditions.push(`ratings >= $${index}`);
    values.push(ratings);
    index++;
  }

  // Add search query
  if (search) {
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`
    );
    values.push(`%${search}%`);
    index++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Get count of filtered products
  const totalProductsResult = await database.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values
  );

  const totalProducts = parseInt(totalProductsResult.rows[0].count);

  paginationPlaceholders.limit = `$${index}`;
  values.push(limit);
  index++;

  paginationPlaceholders.offset = `$${index}`;
  values.push(offset);
  index++;

  // FETCH WITH REVIEWS
  const query = `
    SELECT p.*, 
    COUNT(r.id) AS review_count 
    FROM products p 
    LEFT JOIN reviews r ON p.id = r.product_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ${paginationPlaceholders.limit}
    OFFSET ${paginationPlaceholders.offset}
    `;

  const result = await database.query(query, values);

  // QUERY FOR FETCHING NEW PRODUCTS
  const newProductsQuery = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 8
  `;
  const newProductsResult = await database.query(newProductsQuery);

  // QUERY FOR FETCHING TOP RATING PRODUCTS (rating >= 4.5)
  const topRatedQuery = `
    SELECT p.*,
    COUNT(r.id) AS review_count
    FROM products p
    LEFT JOIN reviews r ON p.id = r.product_id
    WHERE p.ratings >= 4.5
    GROUP BY p.id
    ORDER BY p.ratings DESC, p.created_at DESC
    LIMIT 8
  `;
  const topRatedResult = await database.query(topRatedQuery);

  res.status(200).json({
    success: true,
    products: result.rows,
    totalProducts,
    newProducts: newProductsResult.rows,
    topRatedProducts: topRatedResult.rows,
  });
});

export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  // Normalize body keys to trim accidental spaces in form field names (e.g., ' description ')
  const normalizedBody = Object.fromEntries(
    Object.entries(req.body || {}).map(([k, v]) => [k.trim(), typeof v === "string" ? v.trim() : v])
  );
  const { name, description, price, category, stock } = normalizedBody;
  // Debug logs removed

  // Validate inputs more robustly (allow 0 values for price/stock)
  const missing = [];
  if (typeof name !== "string" || name.trim() === "") missing.push("name");
  if (typeof description !== "string" || description.trim() === "")
    missing.push("description");
  if (typeof category !== "string" || category.trim() === "")
    missing.push("category");

  // Sanitize numeric inputs: strip non-numeric chars (e.g. '$') then parse
  const sanitizeNumber = (v) => {
    if (v === undefined || v === null) return NaN;
    const s = String(v).trim().replace(/[^0-9.-]+/g, "");
    return s === "" ? NaN : Number(s);
  };

  const parsedPrice = sanitizeNumber(price);
  if (Number.isNaN(parsedPrice)) missing.push("price");

  const parsedStock = sanitizeNumber(stock);
  if (Number.isNaN(parsedStock)) missing.push("stock");

  if (missing.length > 0) {
    // Debug logs removed
    return next(
      new ErrorHandler(
        `Please provide complete product details: missing or invalid ${missing.join(", ")}`,
        400
      )
    );
  }
  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);
  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }
  const result = await database.query(
    `UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5 WHERE id = $6 RETURNING *`,
    [name.trim(), description.trim(), parsedPrice, category.trim(), parsedStock, productId]
  );
  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    updatedProduct: result.rows[0],
  });
});
    
 
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);
  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const images = product.rows[0].images;

  const deleteResult = await database.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [productId]
  );

  if (deleteResult.rows.length === 0) {
    return next(new ErrorHandler("Failed to delete product.", 500));
  }

  // Delete images from Cloudinary
  if (images && images.length > 0) {
    for (const image of images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
  });
});



export const fetchSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;

  const result = await database.query(
    `
        SELECT p.*,
        COALESCE(
        json_agg(
        json_build_object(
            'review_id', r.id,
            'rating', r.rating,
            'comment', r.comment,
            'reviewer', json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar', u.avatar
            )) 
        ) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews
         FROM products p
         LEFT JOIN reviews r ON p.id = r.product_id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE p.id  = $1
         GROUP BY p.id`,
    [productId]
  );

  res.status(200).json({
    success: true,
    message: "Product fetched successfully.",
    product: result.rows[0],
  });
});



export const postProductReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  // Normalize incoming body (handles JSON and form-data with accidental spaces)
  const normalizedBody = Object.fromEntries(
    Object.entries(req.body || {}).map(([k, v]) => [k.trim(), typeof v === "string" ? v.trim() : v])
  );

  // Support rating/comment from body or querystring
  const rawRating = normalizedBody.rating ?? req.query.rating;
  const comment = normalizedBody.comment ?? req.query.comment;

  if (rawRating === undefined || comment === undefined) {
    // Debug logs removed
    return next(new ErrorHandler("Please provide rating and comment.", 400));
  }

  // Sanitize and parse rating as a number
  const parsedRating = Number(String(rawRating).trim().replace(/[^0-9.-]+/g, ""));
  if (Number.isNaN(parsedRating)) return next(new ErrorHandler("Invalid rating.", 400));
  const purchasheCheckQuery = `
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN payments p ON p.order_id = o.id
    WHERE o.buyer_id = $1
    AND oi.product_id = $2
    AND p.payment_status = 'Paid'
    LIMIT 1 
  `;

  const { rows } = await database.query(purchasheCheckQuery, [
    req.user.id,
    productId,
  ]);

  if (rows.length === 0) {
    return res.status(403).json({
      success: false,
      message: "You can only review a product you've purchased.",
    });
  }

  const product = await database.query("SELECT * FROM products WHERE id = $1", [
    productId,
  ]);
  if (product.rows.length === 0) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  const isAlreadyReviewed = await database.query(
    `
    SELECT * FROM reviews WHERE product_id = $1 AND user_id = $2
    `,
    [productId, req.user.id]
  );

  let review;

  if (isAlreadyReviewed.rows.length > 0) {
    review = await database.query(
      "UPDATE reviews SET rating = $1, comment = $2 WHERE product_id = $3 AND user_id = $4 RETURNING *",
      [parsedRating, comment, productId, req.user.id]
    );
  } else {
    review = await database.query(
      "INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [productId, req.user.id, parsedRating, comment]
    );
  }

  const allReviews = await database.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
    [productId]
  );

  const newAvgRating = allReviews.rows[0].avg_rating;

  const updatedProduct = await database.query(
    `
        UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *
        `,
    [newAvgRating, productId]
  );

  res.status(200).json({
    success: true,
    message: "Review posted.",
    review: review.rows[0],
    product: updatedProduct.rows[0],
  });
});




export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const review = await database.query(
    "DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING *",
    [productId, req.user.id]
  );

  if (review.rows.length === 0) {
    return next(new ErrorHandler("Review not found.", 404));
  }

  const allReviews = await database.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE product_id = $1`,
    [productId]
  );

  const newAvgRating = allReviews.rows[0].avg_rating;

  const updatedProduct = await database.query(
    `
        UPDATE products SET ratings = $1 WHERE id = $2 RETURNING *
        `,
    [newAvgRating, productId]
  );

  res.status(200).json({
    success: true,
    message: "Your review has been deleted.",
    review: review.rows[0],
    product: updatedProduct.rows[0],
  });
});



export const fetchAIFilteredProducts = catchAsyncErrors(
  async (req, res, next) => {
    const { userPrompt } = req.body;
    // Debug logs removed
    if (!userPrompt) {
      return next(new ErrorHandler("Provide a valid prompt.", 400));
    }

    const filterKeywords = (query) => {
      const stopWords = new Set([
        "the",
        "they",
        "them",
        "then",
        "I",
        "we",
        "you",
        "he",
        "she",
        "it",
        "is",
        "a",
        "an",
        "of",
        "and",
        "or",
        "to",
        "for",
        "from",
        "on",
        "who",
        "whom",
        "why",
        "when",
        "which",
        "with",
        "this",
        "that",
        "in",
        "at",
        "by",
        "be",
        "not",
        "was",
        "were",
        "has",
        "have",
        "had",
        "do",
        "does",
        "did",
        "so",
        "some",
        "any",
        "how",
        "can",
        "could",
        "should",
        "would",
        "there",
        "here",
        "just",
        "than",
        "because",
        "but",
        "its",
        "it's",
        "if",
        ".",
        ",",
        "!",
        "?",
        ">",
        "<",
        ";",
        "`",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
      ]);

      return query
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => !stopWords.has(word))
        .map((word) => `%${word}%`);
    };

    const keywords = filterKeywords(userPrompt);
    // Debug logs removed

    // STEP 1: Basic SQL Filtering with simple numeric heuristics
    // Detect price constraints in the prompt like 'under 20000', 'below 20,000',
    // 'above 5000', or 'between 10000 and 20000'. These will be applied server-side
    // so products with matching names and satisfying the price constraint are found.
    let priceMin, priceMax;
    const betweenMatch = userPrompt.match(/between\s+([0-9,]+)\s+and\s+([0-9,]+)/i);
    if (betweenMatch) {
      priceMin = Number(betweenMatch[1].replace(/,/g, ""));
      priceMax = Number(betweenMatch[2].replace(/,/g, ""));
    } else {
      const underMatch = userPrompt.match(/(?:under|below|less than)\s+([0-9,]+)/i);
      if (underMatch) priceMax = Number(underMatch[1].replace(/,/g, ""));
      const overMatch = userPrompt.match(/(?:over|above|greater than|more than)\s+([0-9,]+)/i);
      if (overMatch) priceMin = Number(overMatch[1].replace(/,/g, ""));
    }

    // Build dynamic WHERE clause
    const whereParts = [];
    const params = [];
    // Keyword search (ANY array)
    if (keywords.length > 0) {
      params.push(keywords);
      whereParts.push(`(name ILIKE ANY($${params.length}) OR description ILIKE ANY($${params.length}) OR category ILIKE ANY($${params.length}))`);
    }
    // Price constraints
    if (priceMin !== undefined && !Number.isNaN(priceMin)) {
      params.push(priceMin);
      whereParts.push(`price >= $${params.length}`);
    }
    if (priceMax !== undefined && !Number.isNaN(priceMax)) {
      params.push(priceMax);
      whereParts.push(`price <= $${params.length}`);
    }

    // If no where parts (unlikely), default to returning first 200 products
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const result = await database.query(
      `
        SELECT * FROM products
        ${whereClause}
        LIMIT 200;     
        `,
      params
    );

    const filteredProducts = result.rows;
    // Debug logs removed

    if (filteredProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found matching your prompt.",
        products: [],
      });
    }

    // STEP 2: AI FILTERING
    const aiResult = await getAIRecommendation(req, res, userPrompt, filteredProducts);
    if (!aiResult || aiResult.success !== true) {
      // AI failed or returned empty. Fall back to the basic filtered products so users still get results.
      console.warn("AI filtering failed, falling back to SQL results", { aiResult });
      return res.status(200).json({
        success: true,
        message: `AI unavailable or returned nothing. Serving basic filtered results. Reason: ${aiResult?.message || "unknown"}`,
        products: filteredProducts,
      });
    }

    res.status(200).json({
      success: true,
      message: "AI filtered products.",
      products: aiResult.products,
    });
  }
);