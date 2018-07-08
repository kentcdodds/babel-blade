import {Connect, query} from 'urql'

const fragment = createFragment('Movie')
const Movie = ({data}) => {
  let result = fragment(data)
  let movie = result.movie
  return (
    <div>
      <h2>{movie.test.title}</h2>
      <p>{movie.foo}</p>
    </div>
  )
}
Movie.fragment = fragment

const pageQuery = createQuery() // create a top-level query
const App = () => (
  // rendering Movie automatically composes `Movie.fragment` into the query.
  <Connect
    query={query(pageQuery)}
    children={({loaded, data}) => {
      let result2 = pageQuery(data)
      return (
        <div>
          <h1>{result2.monkey}</h1>
          <Movie data={result2.movie} />
        </div>
      )
    }}
  />
)
