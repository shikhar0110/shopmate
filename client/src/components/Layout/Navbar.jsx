import { Menu, User, ShoppingCart, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { toggleAuthPopup, toggleCart, toggleSearchBar, toggleSidebar } from "../../store/slices/popupSlice"
const Navbar = () => {
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()

  const { cart } = useSelector((state) => state.cart)
  let cartItemsCount = 0
  if (cart) {
    cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0)
  }


  return (
    <nav className=" fixed left-0 w-full top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border ">
      <div className=" max-w-7xl mx-auto px-4">
        <div className=" flex items-center justify-between h-16">
          {/* { left  - hamburger menu} */}
          <button onClick={() => dispatch(toggleSidebar())} className=" p-2  rounded-lg hover:bg-secondary transition-colors">
            <Menu />
          </button>
          {/* {center logo} */}
          <div className=" flex-1 flex justify-center" ><h1 className=" text-2xl font-bold text-primary">ShopMate</h1></div>

          {/* {RIGTH SIDE ICONS} */}
          <div className="flex item-center space-x-2">
            {/* {THEME TOGGLE} */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors "
            >
              {
                theme === "dark" ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )
              }

            </button>
            {/* {searching only} */}
            <button
              onClick={() => dispatch(toggleSearchBar())}
              className="p-2 rounded-lg hover:bg-secondary transition-colors "
            >
              <Search className="w-5 h-5 text-foreground" />
            </button>

            {/* {toggle Auth} */}
            <button
              onClick={() => dispatch(toggleAuthPopup())}
              className="p-2 rounded-lg hover:bg-secondary transition-colors "
            >
              <User className="w-5 h-5 text-foreground" />
            </button>
            {/* {cart} */}

            <button
              onClick={() => dispatch(toggleCart())}
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors "
            >
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {
                cartItemsCount >  0  && (
                  <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flext items-center justify-center">{cartItemsCount}</span>
                )
              }
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
