"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, Paper, Typography, Button, TextField, Drawer, List, ListItem, ListItemButton, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Collapse, Skeleton, IconButton } from "@mui/material";


const ClientOnlyEditor = dynamic(() => import("./components/ClientOnlyEditor"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20); // minimal, fixed
  // Auth state
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authTab, setAuthTab] = useState(0); // 0: login, 1: register
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");
  // App state
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  // Profile
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Fetch tables on login
  // On mount, load token from localStorage (client only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('token');
      if (stored) setToken(stored);
    }
  }, []);

  // On token change, update localStorage and fetch data
  useEffect(() => {
    if (token) {
      if (typeof window !== 'undefined') localStorage.setItem('token', token);
      fetchTables();
      fetchRecentQueries();
      fetchProfile();
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('token');
    }
  }, [token]);

  // Auth handlers
  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setError("");
    if (authTab === 0) {
      // Login
      fetch(`${API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })
        .then(r => r.json())
        .then(data => {
          if (data.access_token) {
            setToken(data.access_token);
            setError("");
            setUsername("");
            setPassword("");
            // localStorage will be updated by useEffect
          } else {
            setError("Invalid credentials");
          }
          setLoginLoading(false);
        })
        .catch(() => {
          setError("Login failed");
          setLoginLoading(false);
        });
    } else {
      // Register
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoginLoading(false);
        return;
      }
      fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.message) {
            setError("Registered! Now login.");
            setAuthTab(0);
            setUsername("");
            setPassword("");
            setConfirmPassword("");
          } else {
            setError(data.detail || "Registration failed");
          }
          setLoginLoading(false);
        })
        .catch(() => {
          setError("Registration failed");
          setLoginLoading(false);
        });
    }
  }

  function handleLogout() {
    setToken("");
    setUsername("");
    setPassword("");
    setUserProfile(null);
    setShowProfile(false);
    localStorage.removeItem('token');
  }

  // Table fetchers
  function fetchTables() {
    fetch(`${API_URL}/tables`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setTables);
  }
  function fetchTableInfo(name: string) {
    setSelectedTable(name);
    setShowTableModal(true);
    setLoading(true);
    fetch(`${API_URL}/table_info`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ table: name }),
    })
      .then(r => r.json())
      .then(data => {
        setTableInfo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }
  function fetchRecentQueries() {
    fetch(`${API_URL}/recent_queries`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setRecentQueries);
  }
  function fetchProfile() {
    fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setUserProfile)
      .catch(() => setUserProfile(null));
  }

  // Query runner
  // @ts-ignore
  function handleRunQuery(e, customQuery) {
    if (e) e.preventDefault();
    
    const queryToRun = customQuery || query;
    if (!queryToRun || queryToRun.trim() === "") {
      setError("Please write a query before running.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);
    fetch(`${API_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: queryToRun }),
    })
      .then(r => r.json())
      .then(data => {
        setResult(data);
        setPage(0);
        fetchRecentQueries();
        setLoading(false);
        if (Array.isArray(data)) {
          setError("Query executed successfully.");
        } else if (data && data.error) {
          setError(data.error);
        }
      })
      .catch(() => {
        setError("Query failed: Network or server error.");
        setLoading(false);
      });
  }

  // UI
  if (!token) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f6fa" }}>
        <Paper elevation={4} sx={{ p: 4, minWidth: 340, borderRadius: 3, boxShadow: 6 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: "bold", textAlign: "center", color: "#1976d2" }}>
            SQL Runner Login
          </Typography>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} required fullWidth autoFocus variant="outlined" sx={{ mb: 2 }} />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth variant="outlined" sx={{ mb: 2 }} />
            {authTab === 1 && (
              <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required fullWidth variant="outlined" sx={{ mb: 2 }} />
            )}
            <Button variant="contained" color="primary" type="submit" disabled={loginLoading} fullWidth sx={{ py: 1.3, fontWeight: 700, fontSize: "15px", mt: 1 }}>
              {loginLoading ? (authTab === 0 ? "Signing in..." : "Creating account...") : authTab === 0 ? "SIGN IN" : "CREATE ACCOUNT"}
            </Button>
          </form>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center", mt: 2 }}>
            <Typography variant="body2" sx={{ color: "#666" }}>{authTab === 0 ? "Don't have an account?" : "Already have an account?"}</Typography>
            <Typography sx={{ color: "#1976d2", cursor: "pointer", fontWeight: 600, fontSize: "14px", textDecoration: "underline" }} onClick={() => { setAuthTab(authTab === 0 ? 1 : 0); setUsername(""); setPassword(""); setConfirmPassword(""); setError(""); }}>{authTab === 0 ? "Sign up" : "Sign in"}</Typography>
          </Box>
          {error && (
            <Typography
              sx={{
                mt: 2,
                color:
                  error.includes('Registered! Now login.') || error.includes('Password reset! Now login.')
                    ? 'green'
                    : 'red',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {error}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f6fa" }}>
      {/* Sidebar with tables */}
      <Drawer variant="permanent" PaperProps={{ sx: { width: 240, bgcolor: "#f8fafc", borderRight: "1px solid #e3eafc" } }}>
        <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6" fontWeight={900} fontSize={24} color="#1976d2" mb={2}>Tables</Typography>
          <List sx={{ flex: 1, overflow: "auto" }}>
            {tables
              .filter(t => t !== "sqlite_sequence" && t.toLowerCase() !== "users" && t.toLowerCase() !== "recent_queries")
              .map(t => (
                <ListItem key={t} disablePadding>
                  <ListItemButton selected={selectedTable === t} onClick={() => fetchTableInfo(t)} sx={{ borderRadius: 2, mb: 1, '&.Mui-selected': { bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700 } }}>
                    <ListItemText primary={t} sx={{ fontWeight: 600, fontSize: 17, fontFamily: 'Inter, sans-serif' }} />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </Box>
      </Drawer>
      {/* Main content */}
      <Box sx={{ flex: 1, p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Box sx={{ width: "100%", maxWidth: 700, mb: 2 }}>
          <Typography variant="h5" fontWeight={700} color="#1976d2">SQL Query Runner</Typography>
        </Box>
        <Paper elevation={3} sx={{ width: "100%", maxWidth: 700, p: 3, borderRadius: 3, mb: 3 }}>
          {/* @ts-ignore */}
          <form onSubmit={e => handleRunQuery(e, undefined)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* SQL Editor with syntax highlighting (client-only) */}
            <Box sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', bgcolor: '#fafbfc' }}>
              <ClientOnlyEditor value={query} onChange={setQuery} />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="contained" color="primary" type="submit" disabled={loading || !query.trim()} sx={{ fontWeight: 700, px: 4, py: 1.5 }}>{loading ? "Running..." : "Run Query"}</Button>
            </Box>
          </form>
          {error && (
            <Typography
              sx={{
                mt: 2,
                color:
                  error === 'Query executed successfully.'
                    ? 'green'
                    : error.toLowerCase().includes('no such table')
                    ? '#d32f2f'
                    : error.includes('Registered! Now login.') || error.includes('Password reset! Now login.')
                    ? 'green'
                    : 'red',
                fontWeight: 600,
                textAlign: 'center',
                bgcolor:
                  error === 'Query executed successfully.' ? '#e8f5e9' :
                  error.toLowerCase().includes('no such table') ? '#ffebee' :
                  undefined,
                borderRadius: 1,
                p: 1,
              }}
            >
              {error === 'Query executed successfully.' && (
                <>
                  ✅ <b>Query executed successfully.</b>
                </>
              )}
              {error.toLowerCase().includes('no such table') && (
                <>
                  ❌ <b>Error:</b> {error}
                </>
              )}
              {!error.includes('Registered! Now login.') && !error.includes('Password reset! Now login.') &&
                error !== 'Query executed successfully.' &&
                !error.toLowerCase().includes('no such table') && (
                  <>{error}</>
                )}
              {error.includes('Registered! Now login.') && <>{error}</>}
              {error.includes('Password reset! Now login.') && <>{error}</>}
            </Typography>
          )}
          {loading && (
            <Box sx={{ mt: 2 }}>
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1, borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1, borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="60%" height={40} sx={{ borderRadius: 1 }} />
            </Box>
          )}
        </Paper>
        {/* Results */}
        {loading && (
          <TableContainer component={Paper} sx={{ width: "100%", maxWidth: 900, overflowX: "auto", borderRadius: 3, mb: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="60%" height={40} sx={{ borderRadius: 1 }} />
          </TableContainer>
        )}
        {Array.isArray(result) && result.length > 0 && (
          <TableContainer component={Paper} sx={{ width: "100%", maxWidth: 900, overflowX: "auto", borderRadius: 3, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(result[0]).map(col => (
                    <TableCell key={col} sx={{ fontWeight: 700, color: "#1976d2" }}>{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {result.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((row, i) => (
                  <TableRow key={i}>
                    {Object.keys(row).map(col => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination controls */}
            {result.length > rowsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 1 }}>
                <Button size="small" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
                <Typography sx={{ mx: 2 }}>{page + 1} / {Math.ceil(result.length / rowsPerPage)}</Typography>
                <Button size="small" onClick={() => setPage(p => Math.min(Math.ceil(result.length / rowsPerPage) - 1, p + 1))} disabled={page >= Math.ceil(result.length / rowsPerPage) - 1}>Next</Button>
              </Box>
            )}
          </TableContainer>
        )}
        {Array.isArray(result) && result.length === 0 && (
          <Paper elevation={1} sx={{ width: "100%", maxWidth: 700, p: 3, textAlign: "center" }}>No results.</Paper>
        )}
        {result && !Array.isArray(result) && result.error && (
          <Paper elevation={1} sx={{ width: "100%", maxWidth: 700, p: 3, textAlign: "center", bgcolor: "#ffeaea" }}><Typography color="error">{result.error}</Typography></Paper>
        )}
      </Box>
      {/* Right drawer for profile, logout, recent queries */}
      <Drawer anchor="right" variant="permanent" PaperProps={{ sx: { width: 260, bgcolor: "#fff", boxShadow: 2 } }}>
        <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
          <Button variant="outlined" size="small" onClick={() => setShowProfile(true)} sx={{ fontWeight: 600, mb: 1 }}>Profile</Button>
          <Button variant="outlined" color="error" size="small" onClick={handleLogout} sx={{ fontWeight: 600 }}>Logout</Button>
          <Box sx={{ mt: 4 }}>
            <Button fullWidth variant="outlined" onClick={() => setShowRecent(v => !v)}>Recent Queries</Button>
            <Collapse in={showRecent} sx={{ flex: 1, overflow: "auto", mt: 2 }}>
              {recentQueries.length > 0 ? (
                <Paper elevation={0} sx={{ p: 1 }}>
                  {recentQueries.slice(-10).reverse().map((q, i) => (
                    <Paper key={i} elevation={0} sx={{ p: 1, mb: 1, bgcolor: "#f0f0f0", borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" sx={{ wordBreak: "break-all", display: "block" }}>{q.query}</Typography>
                        {q.timestamp && (
                          <Typography variant="caption" sx={{ color: '#888', fontSize: 11 }}>{new Date(q.timestamp).toLocaleString()}</Typography>
                        )}
                      </Box>
                      <IconButton size="small" onClick={() => { setQuery(q.query); handleRunQuery(null, q.query); }} title="Re-run this query">
                        ↻
                      </IconButton>
                    </Paper>
                  ))}
                </Paper>
              ) : (
                <Typography variant="body2" sx={{ mt: 2 }}>No recent queries</Typography>
              )}
            </Collapse>
          </Box>
        </Box>
      </Drawer>
      {/* Table schema modal */}
      <Dialog open={showTableModal} onClose={() => setShowTableModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: '#1976d2', letterSpacing: 1 }}>{selectedTable} Table Details</DialogTitle>
        <DialogContent>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : tableInfo ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>Columns</Typography>
              <Table size="small" sx={{ mb: 3, borderRadius: 2, boxShadow: 1, background: '#f8fafc' }}>
                <TableHead>
                  <TableRow sx={{ background: '#e3f2fd' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableInfo.columns?.map((col, idx) => (
                    <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#fff' : '#f5f6fa' }}>
                      <TableCell>{col.name}</TableCell>
                      <TableCell>{col.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: '#1976d2' }}>Sample Data</Typography>
              <Table size="small" sx={{ borderRadius: 2, boxShadow: 1, background: '#f8fafc' }}>
                <TableHead>
                  <TableRow sx={{ background: '#e3f2fd' }}>
                    {tableInfo.columns?.map(col => (
                      <TableCell key={col.name} sx={{ fontWeight: 700 }}>{col.name}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableInfo.sample_data?.map((row, idx) => (
                    <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#fff' : '#f5f6fa' }}>
                      {tableInfo.columns?.map(col => (
                        <TableCell key={col.name}>{row[col.name]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography>No info available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTableModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Profile dialog */}
      <Dialog open={showProfile} onClose={() => setShowProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Profile</DialogTitle>
        <DialogContent>
          {userProfile ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                <Typography variant="body1" fontWeight={500}>{userProfile.username}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                <Typography variant="body1">{new Date(userProfile.created_at).toLocaleDateString()}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Total Queries Executed</Typography>
                <Typography variant="body1" fontWeight={500}>{userProfile.total_queries}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                <Typography variant="body1">{new Date(userProfile.last_login).toLocaleString()}</Typography>
              </Box>
            </Box>
          ) : (
            <Typography>Loading profile...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProfile(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}