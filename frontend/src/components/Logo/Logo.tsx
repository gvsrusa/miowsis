import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

interface LogoProps extends SvgIconProps {
  variant?: 'icon' | 'full';
}

const Logo: React.FC<LogoProps> = ({ variant = 'icon', ...props }) => {
  if (variant === 'full') {
    return (
      <SvgIcon
        viewBox="0 0 200 50"
        sx={{ width: 'auto', height: '100%', ...props.sx }}
        {...props}
      >
        {/* Icon part */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2196F3" />
            <stop offset="100%" stopColor="#4CAF50" />
          </linearGradient>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#8BC34A" />
          </linearGradient>
        </defs>
        
        {/* Main circle representing globe/wholeness */}
        <circle cx="25" cy="25" r="20" fill="url(#logoGradient)" opacity="0.1" />
        
        {/* Growth chart bars */}
        <rect x="15" y="30" width="4" height="10" fill="url(#logoGradient)" rx="1" />
        <rect x="23" y="25" width="4" height="15" fill="url(#logoGradient)" rx="1" />
        <rect x="31" y="20" width="4" height="20" fill="url(#logoGradient)" rx="1" />
        
        {/* Leaf symbol for sustainability */}
        <path
          d="M25 15 Q20 10 15 15 Q15 25 25 25 Q35 25 35 15 Q30 10 25 15"
          fill="url(#leafGradient)"
          opacity="0.8"
        />
        
        {/* Text part */}
        <text x="55" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="600" fill="#1976D2">
          MIOwSIS
        </text>
        <text x="55" y="42" fontFamily="Arial, sans-serif" fontSize="10" fill="#666" letterSpacing="1">
          SUSTAINABLE INVESTING
        </text>
      </SvgIcon>
    );
  }

  // Icon only version
  return (
    <SvgIcon viewBox="0 0 50 50" {...props}>
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#4CAF50" />
        </linearGradient>
        <linearGradient id="iconLeafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#8BC34A" />
        </linearGradient>
      </defs>
      
      {/* Main circle */}
      <circle cx="25" cy="25" r="22" fill="url(#iconGradient)" opacity="0.15" />
      
      {/* Growth chart bars */}
      <rect x="15" y="30" width="4" height="10" fill="url(#iconGradient)" rx="1" />
      <rect x="23" y="25" width="4" height="15" fill="url(#iconGradient)" rx="1" />
      <rect x="31" y="20" width="4" height="20" fill="url(#iconGradient)" rx="1" />
      
      {/* Leaf symbol */}
      <path
        d="M25 15 Q20 10 15 15 Q15 25 25 25 Q35 25 35 15 Q30 10 25 15"
        fill="url(#iconLeafGradient)"
        opacity="0.8"
      />
    </SvgIcon>
  );
};

export default Logo;