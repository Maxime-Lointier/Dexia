import React from "react";
import { View, Text, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "../context/ThemeContext";
import { t } from "../i18n";

const screenWidth = Dimensions.get("window").width;

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
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {t('home.likePrompt')}
        </Text>
      </View>
    );
  }

  // ordre décroissant
  const sorted = [...data].sort((a, b) => b.count - a.count);

  // 8 premiers genre
  const mainGenres = sorted.slice(0, 8);
  const otherGenres = sorted.slice(8);

  // calculer les Autres
  const otherCount = otherGenres.reduce((sum, g) => sum + g.count, 0);

  const finalData: GenreData[] =
    otherCount > 0
      ? [...mainGenres, { name: "Autres", count: otherCount }]
      : mainGenres;

  const total = finalData.reduce((sum, g) => sum + g.count, 0);

  const chartColors = [
    "#EF4444",
    "#F97316",
    "#FACC15",
    "#22C55E",
    "#14B8A6",
    "#3B82F6",
    "#6366F1",
    "#A855F7",
    "#EC4899", 
  ];

const pieData = finalData.map((item, index) => {
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
    <View style={{ alignItems: "center" }}>
      <PieChart
  data={pieData}
  width={screenWidth - 64}
  height={220}
  accessor="population"
  backgroundColor="transparent"
  paddingLeft="10"
  chartConfig={{
    color: () => colors.text,
  }}
/>

</View>
  );
}
