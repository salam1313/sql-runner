
import React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface TableInfo {
  columns: { name: string; type: string }[];
  sample_data: Record<string, any>[];
}

interface TableSchemaProps {
  tableName: string;
  tableInfo: TableInfo | null;
  onClose: () => void;
}

const TableSchema: React.FC<TableSchemaProps> = ({ tableName, tableInfo, onClose }) => {
  if (!tableInfo) return null;
  return (
    <Paper sx={{ p: 3, m: 2, width: '100%', maxWidth: 900, mx: 'auto', borderRadius: 3, boxShadow: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
        {tableName} Schema & Sample Data
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Columns:</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableInfo.columns.map((col) => (
              <TableRow key={col.name}>
                <TableCell>{col.name}</TableCell>
                <TableCell>{col.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Sample Rows:</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {tableInfo.columns.map((col) => (
                <TableCell key={col.name}>{col.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableInfo.sample_data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableInfo.columns.length} align="center">
                  No sample data available.
                </TableCell>
              </TableRow>
            ) : (
              tableInfo.sample_data.map((row, idx) => (
                <TableRow key={idx}>
                  {tableInfo.columns.map((col) => (
                    <TableCell key={col.name}>{row[col.name]}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button onClick={onClose} sx={{ mt: 2, float: 'right' }} variant="outlined">Close</Button>
    </Paper>
  );
};

export default TableSchema;
