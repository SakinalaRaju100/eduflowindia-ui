import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { classroomAPI } from '@/api/client';
import ClassroomCard from '@/components/common/ClassroomCard';

export default function TeacherClasses() {
  const navigate = useNavigate();
  const { selectedYear, selectedAcademicYearObject } = useOutletContext() || {};
  const { data, isLoading } = useQuery({ queryKey:['t-classes'], queryFn:()=>classroomAPI.getAll() });
  const classes = data?.data?.data || [];

  const filteredClasses = classes.filter(c => {
    let matchDates = false;
    if (selectedAcademicYearObject?.startDate && selectedAcademicYearObject?.endDate && c.academicStartDate && c.academicEndDate) {
      try {
        const cStart = new Date(c.academicStartDate).setHours(0, 0, 0, 0);
        const cEnd = new Date(c.academicEndDate).setHours(0, 0, 0, 0);
        const sStart = new Date(selectedAcademicYearObject.startDate).setHours(0, 0, 0, 0);
        const sEnd = new Date(selectedAcademicYearObject.endDate).setHours(0, 0, 0, 0);
        matchDates = cStart >= sStart && cEnd <= sEnd;
      } catch (e) { /* ignore invalid dates */ }
    }
    return (!selectedYear || c.academicYear === selectedYear) || matchDates;
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>My Classes</Typography>
      {isLoading ? <Typography>Loading...</Typography> : (
        <Grid container spacing={2.5}>
          {/* {classes.map(c => ( */}
          {filteredClasses.map(c => (
            <Grid item xs={12} sm={6} lg={4} key={c._id}>
              <ClassroomCard classroom={c} onClick={()=>navigate(`/teacher/classes/${c._id}`)} />
            </Grid>
          ))}
          {filteredClasses.length===0 && <Grid item xs={12}><Typography color="text.secondary" align="center" sx={{py:4}}>No classes found for the selected academic year.</Typography></Grid>}
        </Grid>
      )}
    </Box>
  );
}
