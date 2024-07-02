const errorHandler: ErrorRequestHandler = (err, req, res) => {
  res.status(err.status || 500)
  res.setHeader('Content-Type', 'application/json')
  if (req.app.get('env') === 'development') {
    res.send(JSON.stringify(err, undefined, 2))
  } else {
    res.send(JSON.stringify({ message: err.message }))
  }
}
