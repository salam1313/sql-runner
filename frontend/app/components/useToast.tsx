"use client";

import { useState } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";


export default function useToast() {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: AlertColor }>({ open: false, message: "", severity: "info" });

  const showToast = (message: string, severity: AlertColor = "info") => {
    setToast({ open: true, message, severity });
  };

  const handleClose = () => {
    setToast({ ...toast, open: false });
  };

  const Toast = (
    <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      <Alert onClose={handleClose} severity={toast.severity} sx={{ width: "100%" }}>
        {toast.message}
      </Alert>
    </Snackbar>
  );

  return { showToast, Toast };
}
