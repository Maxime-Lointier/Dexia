import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface LogoProps {
    width?: number;
    height?: number;
    color?: string;
}

export const Logo: React.FC<LogoProps> = ({ width = 100, height = 100, color }) => {
    const { isDark } = useTheme();

    // Couleur automatique selon le thème si non spécifiée
    const fillColor = color ?? (isDark ? '#FFFFFF' : '#0F0F1E');

    return (
        <Svg width={width} height={height} viewBox="0 0 1503 1503" fill="none">
            <G transform="matrix(1,0,0,1,-1865.235158,134.625335)">
                <G transform="matrix(0.4507,0,-0,0.4507,2616.401825,616.541331)">
                    <G transform="matrix(1,0,0,1,-1666.666667,-1666.666667)">
                        <G transform="matrix(4.166667,0,0,4.166667,0,0)">
                            <G>
                                <G transform="matrix(0.24,0,0,0.24,0,0)">
                                    <Path
                                        d="M2474.833,1750L1656.458,916.667L2212.958,916.667L3039.792,1750L2212.958,2583.333L1656.458,2583.333L2474.833,1750Z"
                                        fill={fillColor}
                                    />
                                </G>
                                <G transform="matrix(0.24,0,0,0.24,0,0)">
                                    <Path
                                        d="M416.667,2583.333L416.667,916.667L1128.625,916.667C1128.625,916.667 1361.417,920.958 1640.083,1198.958L2192.208,1750L1640.083,2301.042C1361.417,2579.042 1128.625,2583.333 1128.625,2583.333L416.667,2583.333ZM806.625,1775L806.667,1775.03L806.667,1778.345L806.625,1778.375L808.333,2220.042L1029.167,2220.042C1029.167,2220.042 1438.042,2226.625 1438.042,1778.375C1438.042,1777.811 1438.041,1777.249 1438.039,1776.688C1438.041,1776.126 1438.042,1775.564 1438.042,1775C1438.042,1766.504 1437.895,1758.172 1437.607,1750C1422.69,1326.997 1029.167,1333.333 1029.167,1333.333L808.333,1333.333L806.625,1775Z"
                                        fill={fillColor}
                                    />
                                </G>
                            </G>
                        </G>
                    </G>
                </G>
            </G>
        </Svg>
    );
};
