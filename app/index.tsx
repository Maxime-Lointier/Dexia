import { Link } from 'expo-router';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const Onboarding = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Page Onboarding</Text>

        <Link href="/homeScreen">
          <Text style={styles.link}>Go to homeScreen.tsx</Text>
        </Link>

        <Link href="/welcomeScreen">
          <Text style={styles.link}>Go to welcomeScreen.tsx</Text>
        </Link>

        <Link href="/onBoarding">
          <Text style={styles.link}>Go to onBoarding.tsx</Text>
        </Link>

        <Link href="/settings">
          <Text style={styles.link}>Go to settings.tsx</Text>
        </Link>

        <Link href="/swipe">
          <Text style={styles.link}>Go to swipe.tsx</Text>
        </Link>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5', 
  },
  innerContainer: {
    width: '100%',
    maxWidth: 400, 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center', 
  },
  link: {
    fontSize: 18,
    color: '#007BFF', 
    marginBottom: 12, 
    textAlign: 'center', 
  },
});

export default Onboarding;