import React, { useState, useMemo } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, Typography, Paper, TableSortLabel, useTheme, Skeleton,
} from '@mui/material';
import { Search } from '@mui/icons-material';

export default function DataTable({
  columns, rows, loading, onRowClick, searchKeys, emptyMessage = 'No data found',
  stickyHeader = true, maxHeight = 520, searchPlaceholder = 'Search...', toolbarExtra,
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  const filtered = useMemo(() => {
    let data = rows || [];
    if (search && searchKeys?.length) {
      const q = search.toLowerCase();
      data = data.filter(row => searchKeys.some(key => {
        const val = key.split('.').reduce((o, k) => o?.[k], row);
        return String(val || '').toLowerCase().includes(q);
      }));
    }
    if (orderBy) {
      data = [...data].sort((a, b) => {
        const av = orderBy.split('.').reduce((o, k) => o?.[k], a);
        const bv = orderBy.split('.').reduce((o, k) => o?.[k], b);
        const cmp = String(av || '').localeCompare(String(bv || ''), undefined, { numeric: true });
        return order === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, search, searchKeys, order, orderBy]);

  const handleSort = (key) => {
    setOrder(orderBy === key && order === 'asc' ? 'desc' : 'asc');
    setOrderBy(key);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder={searchPlaceholder} value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> }} />
        {toolbarExtra}
        {search && <Typography variant="caption" color="text.secondary">{filtered.length} of {rows?.length || 0} results</Typography>}
      </Box>
      <TableContainer component={Paper} elevation={0}
        sx={{ maxHeight: stickyHeader ? maxHeight : 'none', border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'auto' }}>
        <Table stickyHeader={stickyHeader} size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={col.key} align={col.align || 'left'}
                  sx={{ minWidth: col.minWidth, width: col.width, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {col.sortable !== false
                    ? <TableSortLabel active={orderBy === col.key} direction={orderBy === col.key ? order : 'asc'} onClick={() => handleSort(col.key)}>{col.label}</TableSortLabel>
                    : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>{columns.map(col => <TableCell key={col.key}><Skeleton height={28} /></TableCell>)}</TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}><Typography color="text.secondary">{emptyMessage}</Typography></TableCell></TableRow>
            ) : (
              filtered.map((row, i) => (
                <TableRow key={row._id || i} onClick={() => onRowClick?.(row)} sx={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                  {columns.map(col => (
                    <TableCell key={col.key} align={col.align || 'left'}>
                      {col.render ? col.render(row) : col.key.split('.').reduce((o, k) => o?.[k], row) ?? '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
