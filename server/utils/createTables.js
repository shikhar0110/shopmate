import {createUserTable} from "../models/userTable.js";
import {createOrderItemTable} from "../models/orderItemsTable.js";
import {createOrdersTable} from "../models/ordersTable.js";
import {createProductsTable} from "../models/productTable.js";
import {createProductReviewsTable} from "../models/productReviewsTable.js";
import {createShippingInfoTable} from "../models/shippinginfoTable.js";
import {createPaymentsTable} from "../models/paymentsTable.js"; 

export  const createTables = async()=>{
    try {
    await createUserTable();
    await createProductsTable();
    await createProductReviewsTable();
    await createOrdersTable();
    await createOrderItemTable();
    await createShippingInfoTable();
    await createPaymentsTable()
        console.log("Tables created successfully")

    }
    catch(error){
        // Log and continue — table creation can be retried safely on next start.
        console.error("Error while creating tables:", error);
        return;
    }
}