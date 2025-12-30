import { useState } from "react";
import { X, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSearchBar } from "../../store/slices/popupSlice"
const SearchOverlay = () => {
  const [searchQuery, setSearchQwery] = useState("")
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { isSearchBarOpen } = useSelector((state) => state.popup)
  if (!isSearchBarOpen) {
    return null
  }

  const handleSeching = () => {
    if (searchQuery.trim() !== "") {
      dispatch(toggleSearchBar())
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (<>
    <div className="fixed insert-0 z-50">
      {/* {Glass Background} */}
      <div className="absolute insert-0 backdrop-blur-md bg-[hsla(var(--glass-bg))] ">
        {/* {SEARCH CONTAINER} */}
        <div className="relative z-10 animate-slide-in-top">
          <div className="glass-panel m-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6 ">
              <h2 className="text-xl font-semibold text-primary">
                Search Products
              </h2>
              <button className="p-2 rounded-lg glass-card hover:glow-on-hover animate-smooth" onClick={() => dispatch(toggleSearchBar())}>
                <X className="w-5 h-5 text-primary" />
              </button>
            </div>

            <div className="relative">
              {/* {SEARCH ICON BUTTON} */}
              <button
                onClick={handleSeching}
                className="absolute left-4 top-1/2 transfrom -traslate-y-1/2 w-5 h-5 text-muted-foreground"
              >
                <Search />

              </button>
            </div>





          </div>
        </div>
      </div>
    </div>



  </>);
};

export default SearchOverlay;
