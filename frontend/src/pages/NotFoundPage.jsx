// 404 Not Found Page
import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import {
  Home as HomeIcon,
  SearchOff as NotFoundIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
          py: 4,
        }}
      >
        <NotFoundIcon sx={{ fontSize: 120, color: "grey.400", mb: 3 }} />

        <Typography
          variant="h1"
          fontWeight={700}
          color="primary.main"
          sx={{ fontSize: { xs: "4rem", md: "6rem" } }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          fontWeight={600}
          color="text.primary"
          gutterBottom
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 400 }}
        >
          Sorry, the page you are looking for doesn't exist or has been moved.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ borderRadius: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default NotFoundPage;
