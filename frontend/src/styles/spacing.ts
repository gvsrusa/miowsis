// Global spacing constants for consistent UI
export const spacing = {
  // Page level spacing
  pageMargin: 3,
  sectionGap: 4,
  
  // Component spacing
  cardPadding: 3,
  componentGap: 3,
  
  // Element spacing
  elementGap: 2,
  smallGap: 1,
  
  // Specific use cases
  headerMargin: 3,
  tabPadding: 3,
  tablePadding: 2,
  modalPadding: 4
};

// MUI sx props for common spacing patterns
export const spacingStyles = {
  // Page container
  pageContainer: {
    p: spacing.pageMargin
  },
  
  // Section spacing
  section: {
    mb: spacing.sectionGap
  },
  
  // Card/Paper components
  card: {
    p: spacing.cardPadding
  },
  
  // Headers
  pageHeader: {
    mb: spacing.headerMargin
  },
  
  // Grid containers
  gridContainer: {
    spacing: spacing.componentGap
  }
};