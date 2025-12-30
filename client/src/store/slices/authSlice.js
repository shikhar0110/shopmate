import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAuthPopup } from "./popupSlice"
export const register = createAsyncThunk(
  "auth/register",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/register", data);
      toast.success(res.data.message);
      thunkAPI.dispatch(toggleAuthPopup())
      return res.data.user;
    } catch (error) {
      toast.error(error.response.data.message);
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
  }
)


export const login = createAsyncThunk(
  "auth/login",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      toast.success(res.data.message);
      thunkAPI.dispatch(toggleAuthPopup())
      return res.data.user;
    } catch (error) {
      toast.error(error.response.data.message);
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
  }
)


export const getUser = createAsyncThunk(
  "auth/user",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/auth/me");
      toast.success(res.data.message);
      return res.data.user;
    } catch (error) {
      toast.error(error.response.data.message);

      return thunkAPI.rejectWithValue(error.response.data.message)
    }
  }
)



export const logout = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/auth/logout");
      toast.success(res.data.message);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
  }
)


export const updateProfile = createAsyncThunk(
  "auth/profile/update",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/auth/profile/update", data);
      toast.success(res.data.message);
      // thunkAPI.dispatch(toggleAuthPopup())
      return res.data.user;
    } catch (error) {
      toast.error(error.response.data.message);
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
  }
)






const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingPassword: false,
    isRequestingForToken: false,
    isCheckingAuth: true,
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.isSigningUp = true
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isSigningUp = false
        state.authUser = action.payload
      })
      .addCase(register.rejected, (state) => {
        state.isSigningUp = false
      })

      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggingIn = false
        state.authUser = action.payload
      })
      .addCase(login.rejected, (state) => {
        state.isLoggingIn = false
      })

      // Get user cases
      .addCase(getUser.pending, (state) => {
        state.isCheckingAuth = true
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isCheckingAuth = false
        state.authUser = action.payload
      })
      .addCase(getUser.rejected, (state) => {
        state.isCheckingAuth = false
        state.authUser = null
      })

      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.authUser = null
      })
      .addCase(logout.rejected, (state) => {
        // Keep current state on logout failure
      })

      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isUpdatingProfile = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false
        state.authUser = action.payload
      })
      .addCase(updateProfile.rejected, (state) => {
        state.isUpdatingProfile = false
      })


  },
});

export default authSlice.reducer;
