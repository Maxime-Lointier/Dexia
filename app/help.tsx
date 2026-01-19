import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  Linking, 
  LayoutAnimation, 
  Platform, 
  UIManager 
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../src/context/ThemeContext';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "Comment fonctionne le swipe ?",
    answer: "Glissez vers la droite pour aimer un film (Like), vers la gauche pour passer (Dislike)."
  },
  {
    question: "Où sont mes films sauvegardés ?",
    answer: "Vous pouvez retrouver tous vos films aimés et votre watchlist dans l'onglet 'Ma Liste' situé dans onglet Acceuil."
  },
  {
    question: "Comment changer mes genres préférés ?",
    answer: "Allez dans Paramètres > Préférences > Genres préférés. Vous pourrez y sélectionner ou désélectionner les catégories qui vous intéressent."
  },
  {
    question: "L'application fonctionne-t-elle hors ligne ?",
    answer: "Vos listes et préférences sont sauvegardées localement."
  },
];

const HelpSupport = () => {
  const { colors, isDark } = useTheme();

  const handleContactSupport = () => {
    const subject = "Support Dexia App";
    const body = "Bonjour, j'ai besoin d'aide concernant...";
    const mailtoUrl = `mailto:vuong.denis.p@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch((err) => console.error('Erreur lors de l\'ouverture du mail', err));
  };


  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const FAQItem = ({ item }: { item: any }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(!expanded);
    };

    return (
      <View style={[styles.faqContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.faqHeader} onPress={toggleExpand} activeOpacity={0.7}>
          <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
          <Icon 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.faqBody}>
            <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
              {item.answer}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Aide & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        
        {}
        <View style={styles.heroSection}>
            <View style={[styles.heroIconCircle, { backgroundColor: 'rgba(138, 58, 255, 0.1)' }]}>
                <Icon name="lifebuoy" size={48} color="#8A3AFF" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Comment pouvons-nous vous aider ?</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                Trouvez des réponses aux questions fréquentes ou contactez-nous directement.
            </Text>
        </View>

        {}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions Fréquentes</Text>
        <View style={styles.faqList}>
            {FAQ_DATA.map((item, index) => (
                <FAQItem key={index} item={item} />
            ))}
        </View>

        {}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nous contacter</Text>
        <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
                Vous ne trouvez pas la réponse ? Notre équipe est là pour vous aider.
            </Text>
            
            <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactSupport}
            >
                <Icon name="email-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Envoyer un e-mail</Text>
            </TouchableOpacity>

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
  heroSection: {
      alignItems: 'center',
      marginVertical: 24,
  },
  heroIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
  },
  heroTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 24,
      marginBottom: 12,
  },
  faqList: {
      borderRadius: 16,
      overflow: 'hidden',
  },
  faqContainer: {
      paddingHorizontal: 16,
      borderBottomWidth: 1,
  },
  faqHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
  },
  faqQuestion: {
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
      paddingRight: 10,
  },
  faqBody: {
      paddingBottom: 16,
  },
  contactCard: {
      borderRadius: 16,
      padding: 20,
  },
  contactButton: {
      backgroundColor: '#8A3AFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 20,
  },
  socialRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.1)',
  },
  socialBtn: {
      padding: 8,
  }
});

export default HelpSupport;