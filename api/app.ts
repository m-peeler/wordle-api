import app from '.';


const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server is listening on PORT:', port));