import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

interface GenreData {
  name: string;
  count: number;
}

interface Props {
  data: GenreData[];
}

export default function GenrePieChart({ data }: Props) {
  const { colors } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
          Likez des films pour voir vos genres préférés
        </Text>
      </View>
    );
  }

  // total pour calculer les %
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartColors = [
    '#EF4444',
    '#8B5CF6',
    '#22C55E',
    '#F59E0B',
    '#3B82F6',
    '#EC4899',
    '#14B8A6',
    '#A855F7',
  ];

  const pieData = data.map((item, index) => {
    const percent = Math.round((item.count / total) * 100);

    return {
      name: item.name,
      population: percent,
      color: chartColors[index % chartColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <PieChart
        data={pieData}
        width={screenWidth - 64}
        height={220}
        chartConfig={{
          color: () => colors.text,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
      />
    </View>
  );
}
