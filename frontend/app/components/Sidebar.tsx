import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

interface SidebarProps {
  tables: string[];
  onTableClick: (table: string) => void;
  selectedTable: string;
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tables, onTableClick, selectedTable, open, onClose }) => (
  <Drawer
    anchor="left"
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: 300,
        background: 'rgba(255,255,255,0.95)',
        boxShadow: 3,
        borderRadius: '0 16px 16px 0',
      },
    }}
  >
    <Typography variant="h6" sx={{ p: 2, fontWeight: 'bold', textAlign: 'center' }}>
      Database Tables
    </Typography>
    <List>
      {tables.map((table) => (
        <ListItem key={table} disablePadding>
          <ListItemButton
            selected={selectedTable === table}
            onClick={() => onTableClick(table)}
            sx={{ borderRadius: 2, m: 1 }}
          >
            <ListItemText primary={table} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  </Drawer>
);

export default Sidebar;
