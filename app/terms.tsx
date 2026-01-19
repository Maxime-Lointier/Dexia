import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  StyleSheet 
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';

const Terms = () => {
  const { colors, isDark } = useTheme();

  // Composant helper pour une section de texte
  const TermSection = ({ number, title, content }: { number: string, title: string, content: string }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        <Text style={{ color: '#8A3AFF' }}>{number}. </Text>
        {title}
      </Text>
      <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
        {content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Conditions d'utilisation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 }}>
        
        {/* Intro */}
        <Text style={{ color: colors.textSecondary, marginBottom: 20, fontStyle: 'italic' }}>
            Dernière mise à jour : 19 Janvier 2026
        </Text>

        <Text style={[styles.introText, { color: colors.text }]}>
            Bienvenue sur Dexia. En utilisant notre application, vous acceptez les conditions ci-dessous.
        </Text>

        <View style={styles.divider} />

        {/* Contenu Juridique (Simplifié) */}
        <TermSection 
            number="1"
            title="Utilisation du service"
            content="Dexia est une application de recommandation de films à usage personnel. Vous vous engagez à ne pas utiliser l'application de manière frauduleuse ou à tenter d'extraire les données de manière automatisée."
        />

        <TermSection 
            number="2"
            title="Confidentialité & Données"
            content="Nous adoptons une approche 'Local First'. Vos préférences, votre historique et vos listes sont stockés uniquement sur votre appareil. Aucune donnée personnelle n'est envoyée vers un serveur distant géré par nous."
        />

        <TermSection 
            number="3"
            title="Propriété Intellectuelle"
            content="Les métadonnées des films, les affiches et les images sont fournies par TMDB (The Movie Database). Dexia n'est pas endossé ou certifié par TMDB. Le design et le code source de l'application restent la propriété de Dexia."
        />

        <TermSection 
            number="4"
            title="Limitation de responsabilité"
            content="L'application est fournie 'telle quelle'. Nous ne garantissons pas que les recommandations seront toujours parfaites ou que le service sera ininterrompu (dépendance à l'API TMDB)."
        />

        <TermSection 
            number="5"
            title="Modifications"
            content="Nous nous réservons le droit de modifier ces conditions à tout moment. Les mises à jour seront signalées dans les notes de version de l'application."
        />

        {/* Footer TMDB */}
        <View style={[styles.footerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="database" size={24} color={colors.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 12 }}>
                Ce produit utilise l'API TMDB mais n'est pas approuvé ou certifié par TMDB.
            </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  introText: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 20,
  },
  divider: {
      height: 1,
      backgroundColor: '#333',
      marginBottom: 24,
      opacity: 0.5
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
  },
  sectionContent: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'justify'
  },
  footerBox: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      marginTop: 20,
      opacity: 0.8
  }
});

export default Terms;