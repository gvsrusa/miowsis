import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Slider,
  RadioGroup,
  Radio,
  useTheme,
  Card,
  CardContent,
  Stack,
  InputAdornment,
  Tab,
  Tabs
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Payment,
  Language,
  Palette,
  Smartphone,
  Email,
  Lock,
  AccountBalance,
  CreditCard,
  DarkMode,
  LightMode,
  Edit,
  Delete,
  Add,
  Check,
  Close,
  Warning,
  PhotoCamera
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [addPaymentDialog, setAddPaymentDialog] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState({
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@miowsis.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-01-01',
    address: '123 Main St, New York, NY 10001'
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    priceAlerts: true,
    portfolioUpdates: true,
    newsAlerts: true,
    roundupNotifications: true,
    dividendNotifications: true,
    esgAlerts: true
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    biometricEnabled: true,
    loginAlerts: true,
    deviceManagement: true
  });

  // Investment preferences
  const [preferences, setPreferences] = useState({
    riskTolerance: 'moderate',
    investmentGoals: ['retirement', 'wealth-building'],
    autoInvest: true,
    autoInvestAmount: 100,
    autoInvestFrequency: 'monthly',
    roundupEnabled: true,
    roundupMultiplier: 2,
    esgPreference: 'high',
    excludedSectors: [] as string[]
  });

  // Payment methods
  const [paymentMethods] = useState([
    {
      id: '1',
      type: 'bank',
      name: 'Chase Checking ****1234',
      isDefault: true,
      icon: <AccountBalance />,
      verified: true,
      lastUsed: '2024-06-10'
    },
    {
      id: '2',
      type: 'card',
      name: 'Visa ****5678',
      isDefault: false,
      icon: <CreditCard />,
      verified: true,
      lastUsed: '2024-06-05'
    },
    {
      id: '3',
      type: 'bank',
      name: 'Wells Fargo Savings ****9876',
      isDefault: false,
      icon: <AccountBalance />,
      verified: true,
      lastUsed: '2024-05-28'
    },
    {
      id: '4',
      type: 'card',
      name: 'Mastercard ****4321',
      isDefault: false,
      icon: <CreditCard />,
      verified: false,
      lastUsed: null
    }
  ]);

  const handleProfileUpdate = () => {
    console.log('Updating profile...', profile);
  };

  const handlePasswordChange = () => {
    console.log('Changing password...');
  };

  const handleEnable2FA = () => {
    setTwoFactorDialog(true);
  };

  const handleDeleteAccount = () => {
    setDeleteAccountDialog(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={600}>
          Settings
        </Typography>
        <Button variant="contained" startIcon={<Check />}>
          Save Changes
        </Button>
      </Box>

      {/* Settings Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Profile" icon={<Person />} iconPosition="start" />
          <Tab label="Security" icon={<Security />} iconPosition="start" />
          <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
          <Tab label="Payment Methods" icon={<Payment />} iconPosition="start" />
          <Tab label="Investment Preferences" icon={<AccountBalance />} iconPosition="start" />
          <Tab label="Appearance" icon={<Palette />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Profile Settings */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar
                    sx={{ width: 100, height: 100, mr: 3 }}
                    src="/avatar.jpg"
                  >
                    {profile.firstName[0]}{profile.lastName[0]}
                  </Avatar>
                  <Box>
                    <Button variant="outlined" startIcon={<PhotoCamera />} size="small">
                      Change Photo
                    </Button>
                    <Typography variant="caption" display="block" mt={1} color="textSecondary">
                      JPG, PNG or GIF. Max size 5MB
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      InputProps={{
                        endAdornment: (
                          <Chip label="Verified" size="small" color="success" icon={<Check />} />
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
                <Box mt={3}>
                  <Button variant="contained" onClick={handleProfileUpdate}>
                    Update Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Status
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Verified"
                      secondary="Your email is verified"
                    />
                    <Check color="success" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Smartphone />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone Verified"
                      secondary="Your phone is verified"
                    />
                    <Check color="success" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccountBalance />
                    </ListItemIcon>
                    <ListItemText
                      primary="KYC Status"
                      secondary="Identity verified"
                    />
                    <Chip label="Verified" size="small" color="success" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security Settings */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password & Authentication
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Change Password
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      Last changed 3 months ago
                    </Typography>
                    <Button variant="outlined" onClick={handlePasswordChange}>
                      Change Password
                    </Button>
                  </Box>
                  <Divider />
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={security.twoFactorEnabled}
                          onChange={() => handleEnable2FA()}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            Two-Factor Authentication
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Add an extra layer of security to your account
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={security.biometricEnabled}
                          onChange={(e) => setSecurity({ ...security, biometricEnabled: e.target.checked })}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">
                            Biometric Login
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Use fingerprint or face ID to login
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Preferences
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={security.loginAlerts}
                        onChange={(e) => setSecurity({ ...security, loginAlerts: e.target.checked })}
                      />
                    }
                    label="Email me when a new device logs in"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={security.deviceManagement}
                        onChange={(e) => setSecurity({ ...security, deviceManagement: e.target.checked })}
                      />
                    }
                    label="Enable device management"
                  />
                </Stack>
              </CardContent>
            </Card>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Sessions
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Smartphone />
                    </ListItemIcon>
                    <ListItemText
                      primary="iPhone 13 Pro"
                      secondary="New York, NY • Last active: 2 minutes ago"
                    />
                    <Chip label="Current" size="small" color="primary" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Language />
                    </ListItemIcon>
                    <ListItemText
                      primary="Chrome on MacBook"
                      secondary="New York, NY • Last active: 1 hour ago"
                    />
                    <IconButton size="small">
                      <Close />
                    </IconButton>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Smartphone />
                    </ListItemIcon>
                    <ListItemText
                      primary="Android App"
                      secondary="Brooklyn, NY • Last active: 3 days ago"
                    />
                    <IconButton size="small">
                      <Close />
                    </IconButton>
                  </ListItem>
                </List>
                <Box mt={2}>
                  <Button variant="outlined" color="error" fullWidth>
                    Sign Out All Other Sessions
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Notification Settings */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Channels
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                      />
                    }
                    label="Push Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.smsNotifications}
                        onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                      />
                    }
                    label="SMS Notifications"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Types
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.priceAlerts}
                        onChange={(e) => setNotifications({ ...notifications, priceAlerts: e.target.checked })}
                      />
                    }
                    label="Price Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.portfolioUpdates}
                        onChange={(e) => setNotifications({ ...notifications, portfolioUpdates: e.target.checked })}
                      />
                    }
                    label="Portfolio Updates"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.newsAlerts}
                        onChange={(e) => setNotifications({ ...notifications, newsAlerts: e.target.checked })}
                      />
                    }
                    label="Market News"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.roundupNotifications}
                        onChange={(e) => setNotifications({ ...notifications, roundupNotifications: e.target.checked })}
                      />
                    }
                    label="Roundup Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.dividendNotifications}
                        onChange={(e) => setNotifications({ ...notifications, dividendNotifications: e.target.checked })}
                      />
                    }
                    label="Dividend Payments"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.esgAlerts}
                        onChange={(e) => setNotifications({ ...notifications, esgAlerts: e.target.checked })}
                      />
                    }
                    label="ESG Impact Updates"
                  />
                  <Divider />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.marketingEmails}
                        onChange={(e) => setNotifications({ ...notifications, marketingEmails: e.target.checked })}
                      />
                    }
                    label="Marketing Communications"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Payment Methods */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Payment Methods</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddPaymentDialog(true)}
              >
                Add Payment Method
              </Button>
            </Box>
            <List>
              {paymentMethods.map((method, index) => (
                <ListItem key={method.id} divider={index < paymentMethods.length - 1}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main + '20' }}>
                      {method.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {method.name}
                        {!method.verified && (
                          <Chip label="Verify" size="small" color="warning" icon={<Warning />} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {method.isDefault && <Typography variant="caption">Default payment method</Typography>}
                        {method.lastUsed && (
                          <Typography variant="caption" color="textSecondary">
                            {method.isDefault && ' • '}Last used: {new Date(method.lastUsed).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {method.isDefault && (
                      <Chip label="Default" size="small" color="primary" sx={{ mr: 1 }} />
                    )}
                    {!method.isDefault && (
                      <Button size="small" sx={{ mr: 1 }}>
                        Make Default
                      </Button>
                    )}
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" disabled={method.isDefault}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Investment Preferences */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Profile
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={preferences.riskTolerance}
                    onChange={(e) => setPreferences({ ...preferences, riskTolerance: e.target.value })}
                  >
                    <FormControlLabel value="conservative" control={<Radio />} label="Conservative" />
                    <FormControlLabel value="moderate" control={<Radio />} label="Moderate" />
                    <FormControlLabel value="aggressive" control={<Radio />} label="Aggressive" />
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ESG Preferences
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  How important are ESG factors in your investments?
                </Typography>
                <Slider
                  value={preferences.esgPreference === 'high' ? 100 : preferences.esgPreference === 'medium' ? 50 : 0}
                  onChange={(_, value) => {
                    const esgPref = value === 100 ? 'high' : value === 50 ? 'medium' : 'low';
                    setPreferences({ ...preferences, esgPreference: esgPref });
                  }}
                  marks={[
                    { value: 0, label: 'Low' },
                    { value: 50, label: 'Medium' },
                    { value: 100, label: 'High' }
                  ]}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Auto-Invest Settings
                </Typography>
                <Stack spacing={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.autoInvest}
                        onChange={(e) => setPreferences({ ...preferences, autoInvest: e.target.checked })}
                      />
                    }
                    label="Enable Auto-Invest"
                  />
                  {preferences.autoInvest && (
                    <>
                      <TextField
                        fullWidth
                        label="Auto-Invest Amount"
                        type="number"
                        value={preferences.autoInvestAmount}
                        onChange={(e) => setPreferences({ ...preferences, autoInvestAmount: Number(e.target.value) })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>
                        }}
                      />
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={preferences.autoInvestFrequency}
                          onChange={(e) => setPreferences({ ...preferences, autoInvestFrequency: e.target.value })}
                          label="Frequency"
                        >
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="biweekly">Bi-weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Roundup Settings
                </Typography>
                <Stack spacing={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.roundupEnabled}
                        onChange={(e) => setPreferences({ ...preferences, roundupEnabled: e.target.checked })}
                      />
                    }
                    label="Enable Roundups"
                  />
                  {preferences.roundupEnabled && (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Roundup Multiplier
                      </Typography>
                      <Slider
                        value={preferences.roundupMultiplier}
                        onChange={(_, value) => setPreferences({ ...preferences, roundupMultiplier: value as number })}
                        min={1}
                        max={10}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Sector Exclusions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sector Exclusions
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  Select sectors you want to exclude from your investments
                </Typography>
                <Grid container spacing={1}>
                  {[
                    { value: 'tobacco', label: 'Tobacco', icon: '🚬' },
                    { value: 'alcohol', label: 'Alcohol', icon: '🍺' },
                    { value: 'gambling', label: 'Gambling', icon: '🎰' },
                    { value: 'weapons', label: 'Weapons', icon: '🔫' },
                    { value: 'fossil-fuels', label: 'Fossil Fuels', icon: '⛽' },
                    { value: 'nuclear', label: 'Nuclear', icon: '☢️' },
                    { value: 'adult', label: 'Adult Entertainment', icon: '🔞' },
                    { value: 'cannabis', label: 'Cannabis', icon: '🌿' }
                  ].map((sector) => (
                    <Grid item xs={6} sm={4} md={3} key={sector.value}>
                      <Chip
                        label={`${sector.icon} ${sector.label}`}
                        onClick={() => {
                          const newExclusions = preferences.excludedSectors.includes(sector.value)
                            ? preferences.excludedSectors.filter(s => s !== sector.value)
                            : [...preferences.excludedSectors, sector.value];
                          setPreferences({ ...preferences, excludedSectors: newExclusions });
                        }}
                        color={preferences.excludedSectors.includes(sector.value) ? 'error' : 'default'}
                        variant={preferences.excludedSectors.includes(sector.value) ? 'filled' : 'outlined'}
                        sx={{ width: '100%' }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Appearance Settings */}
      <TabPanel value={tabValue} index={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Theme Preferences
            </Typography>
            <RadioGroup value="light">
              <FormControlLabel
                value="light"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <LightMode />
                    Light Mode
                  </Box>
                }
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <DarkMode />
                    Dark Mode
                  </Box>
                }
              />
              <FormControlLabel
                value="auto"
                control={<Radio />}
                label="System Default"
              />
            </RadioGroup>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Danger Zone */}
      {tabValue === 0 && (
        <Card sx={{ mt: 4, border: `1px solid ${theme.palette.error.main}` }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              Danger Zone
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Warning</AlertTitle>
              These actions are irreversible. Please proceed with caution.
            </Alert>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2FA Dialog */}
      <Dialog open={twoFactorDialog} onClose={() => setTwoFactorDialog(false)}>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Scan this QR code with your authenticator app:
          </Typography>
          <Box display="flex" justifyContent="center" my={3}>
            <Box
              sx={{
                width: 200,
                height: 200,
                bgcolor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              QR Code Placeholder
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Enter verification code"
            placeholder="000000"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFactorDialog(false)}>Cancel</Button>
          <Button variant="contained">Enable 2FA</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialog} onClose={() => setDeleteAccountDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography variant="body2">
            To confirm, please type "DELETE" below:
          </Typography>
          <TextField
            fullWidth
            margin="normal"
            placeholder="Type DELETE to confirm"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error">Delete Account</Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Method Dialog */}
      <Dialog open={addPaymentDialog} onClose={() => setAddPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select label="Payment Type" defaultValue="bank">
                <MenuItem value="bank">Bank Account</MenuItem>
                <MenuItem value="card">Debit/Credit Card</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Account/Card Number"
              placeholder="Enter account or card number"
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Routing Number"
                  placeholder="9 digits"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Account Type"
                  select
                  defaultValue="checking"
                >
                  <MenuItem value="checking">Checking</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Set as default payment method"
            />
            
            <Alert severity="info" icon={<Lock />}>
              Your payment information is encrypted and secure. We use bank-level security to protect your data.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Payment Method</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;