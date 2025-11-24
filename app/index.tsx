import { View, Text } from "react-native";
import "./global.css";

export default function DexiaHome() {
  return (
    <View className="flex-1 bg-black justify-center items-center">
      <View className="w-40 h-40 bg-red-500 rounded-2xl justify-center items-center border-4 border-white shadow-lg shadow-red-500/50">
                <Text className="text-white font-bold text-xl text-center">
          test tailwind
        </Text>

      </View>

      <Text className="text-gray-400 mt-10">test gris texte</Text>

    </View>
  );
}