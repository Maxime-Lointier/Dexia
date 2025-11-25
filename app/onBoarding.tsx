import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Genre, getAllGenres, getTopRatedMovies, Movie } from '../src/models/movies';

const Onboarding = () => {

  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  

  //charger les données au montage du composant
  useEffect(() => {
    console.log('Onboarding');
    loadData();
  }, []);

  //import les modèles pour charger les données
  const loadData = async () => {
    //importe les genres
    const genres = await getAllGenres();
    setGenres(genres);
    console.log("genres : ",genres);

    //importe les films
    const movies = await getTopRatedMovies(20);
    setMovies(movies);
    console.log("movies : ",movies);

  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Genres: {genres.length}</Text>
      <Text>Films: {movies.length}</Text>
    </SafeAreaView>
    
  );
};
export default Onboarding;
