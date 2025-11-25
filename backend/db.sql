CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title TEXT,
  overview TEXT,
  release_date TEXT,
  vote_average REAL,
  poster_path TEXT,
  popularity REAL,
  is_tv INTEGER DEFAULT 0
);

CREATE TABLE genres (
  id INTEGER PRIMARY KEY,
  name TEXT
);

CREATE TABLE movie_genres (
  movie_id INTEGER,
  genre_id INTEGER,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (genre_id) REFERENCES genres(id)
);

CREATE TABLE cast (
  id INTEGER PRIMARY KEY,
  name TEXT,
  profile_path TEXT
);

CREATE TABLE movie_cast (
  movie_id INTEGER,
  cast_id INTEGER,
  role TEXT,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (cast_id) REFERENCES cast(id)
);

CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY,
  preferences TEXT, -- le onboarding puis pourra changer avec like/dislike
  onboarding_done INTEGER DEFAULT 0
);

CREATE TABLE user_interactions (
  id INTEGER PRIMARY KEY,
  movie_id INTEGER,
  action TEXT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id)
);

