import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface GenreData {
  name: string;
  count: number;
}

interface Props {
  data: GenreData[];
}

export default function GenrePieChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <View className="items-center py-6">
        <Text className="text-gray-400 text-sm text-center">
          Likez des films pour voir vos genres préférés
        </Text>
      </View>
    );
  }

  // total pour calculer les %
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const colors = [
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
      color: colors[index % colors.length],
      legendFontColor: '#E5E7EB',
      legendFontSize: 12,
    };
  });

  return (
    <View className="bg-darkCard rounded-2xl p-4 items-center">
      <PieChart
        data={pieData}
        width={screenWidth - 64}
        height={220}
        chartConfig={{
          color: () => '#fff',
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
      />
    </View>
  );
}
