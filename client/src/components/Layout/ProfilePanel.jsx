import { useEffect, useState } from "react";
import { X, LogOut, Upload, Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { logout, updateProfile } from "../../store/slices/authSlice"
import { toggleAuthPopup } from "../../store/slices/popupSlice";
import { Input } from "postcss";
const ProfilePanel = () => {
  const dispatch = useDispatch()

  const { isAuthPopupOpen } = useSelector((state) => state.popup)
  const { authUser, isUpdatingProfile } = useSelector((state) => state.auth)

  const [name, setName] = useState(authUser?.name || "")
  const [email, setEmail] = useState(authUser?.email || "")
  const [avatar, setAvatar] = useState("")

  useEffect(() => {
    if (authUser) {
      setName(authUser?.name || "")
      setEmail(authUser?.email || "")
    }
  }, [authUser])

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPaaword] = useState("")

  const handleLogout = () => {
    dispatch(logout())
  }

  const handleUpateProfile = () => {
    const formData = new FormData();
    formData.append("name", name)
    formData.append("email", email)
    if (avatar) {
      formData.append("avatar", avatar)
      dispatch(updateProfile(formData))
    }
  }

  if (!isAuthPopupOpen || !authUser) {
    return null
  }

  return (<>
    {/* overlay  */}
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => dispatch(toggleSidebar())} />


    {/* {Profile PANEL} */}
    <div className="fixed right-0 top-0 h-full w-96 z-50 glass-panel animate-side-in-right overflow-y-auto">
      <div className="flex items-center justify-between p-6  border-b border-[hlsa(var(--glass-border))]">
        <h1 className="text-xl font-semibold text-primary">Profile</h1>
        <button onClick={() => dispatch(toggleAuthPopup())} className="p-2 rounded-lg glass-card hover:glow-on-hover animate-smooth">
          <X className="w-5 h-5 text-primary" />
        </button>
      </div>
      <div className="p-6">
        {/* {Avatar BASIC INFO} */}
        <div className="text-center mb-6">
          <img
            src={authUser?.avatar?.url || "/avatar-holder.avif"}
            alt={authUser?.name}
            className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary object-cover"
          />
          <h3 className="text-lg font-semibold text-foreground"> {authUser?.name} </h3>
          <p className="text-muted-foreground">{authUser?.email}</p>
        </div>
        {/* {PROFILE UPDATE UI  } */}
        {authUser && (
          <div className="space-y-4 mb-8">
             <h3 className="text-lg font-semibold text-primary">Update Profile</h3>
            <input 
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              className="w-full p-2 rounded border border-border bg-secondary text-foreground "
            
            />
             <input 
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              className="w-full p-2 rounded border border-border bg-secondary text-foreground "
            
            />
             <input 
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full p-2 rounded border border-border bg-secondary text-foreground "
            />
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
              <Upload className="w-4 h-4 text-primary" />
              <span>Uplaod Avatar</span>
              <input type="file" accept="image/*" onChange={(e.target.file[0])} className="hidden" />
            </label>
            <button onClick={handleUpateProfile} className="flex justify-center items-center space-x-3 p-3 rounded-lg glass-card hover:glow-on-hover animate-smooth group w-full">
              {
                isUpdatingProfile ? (<>
                
                </>) :("")
              }

            </button>
          </div>
        )}
      </div>
    </div>
  </>);
};

export default ProfilePanel;
