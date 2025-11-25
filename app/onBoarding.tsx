import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { 
  getAllGenres, 
  getTopRatedMovies, 
  getMoviesByGenre,
  type Movie,
  type Genre 
} from './src/models/movies';

const Onboarding = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Exemple: charger tous les genres
      const allGenres = await getAllGenres();
      setGenres(allGenres);

      // Exemple: charger les 10 meilleurs films
      const movies = await getTopRatedMovies(10);
      setTopMovies(movies);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Page Onboarding
      </Text>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
        Genres disponibles ({genres.length})
      </Text>
      {genres.slice(0, 5).map((genre) => (
        <Text key={genre.id} style={{ marginVertical: 5 }}>
          - {genre.name}
        </Text>
      ))}

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
        Top Films ({topMovies.length})
      </Text>
      {topMovies.map((movie) => (
        <View key={movie.id} style={{ marginVertical: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
          <Text style={{ fontWeight: 'bold' }}>{movie.title}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Note: {movie.vote_average}/10
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default Onboarding;