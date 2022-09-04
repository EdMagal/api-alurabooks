const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./database.json')
let userdb = JSON.parse(fs.readFileSync('./usuarios.json', 'UTF-8'))

server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

function createToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

function usuarioExiste({ email, senha }) {
  return userdb.usuarios.findIndex(user => user.email === email && user.senha === senha) !== -1
}

function emailExiste(email) {
  return userdb.usuarios.findIndex(user => user.email === email) !== -1
}

server.post('/public/registrar', (req, res) => {
  const { email, senha, nome, endereco, complemento, cep } = req.body;

  if (emailExiste(email)) {
    const status = 401;
    const message = 'E-mail já foi utilizado!';
    res.status(status).json({ status, message });
    return
  }

  fs.readFile("./usuarios.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };

    const json = JSON.parse(data.toString());

    const last_item_id = json.usuarios.length > 0 ? json.usuarios[json.usuarios.length - 1].id : 0;

    json.usuarios.push({ id: last_item_id + 1, email, senha, nome, endereco, complemento, cep });
    fs.writeFile("./usuarios.json", JSON.stringify(json), (err) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      }
    });
    userdb = json
  });

  const access_token = createToken({ email, senha })
  res.status(200).json({ access_token })
})

server.post('/public/login', (req, res) => {
  const { email, senha } = req.body;
  if (!usuarioExiste({ email, senha })) {
    const status = 401
    const message = 'E-mail ou senha incorretos!'
    res.status(status).json({ status, message })
    return
  }
  const access_token = createToken({ email, senha })
  let user = { ...userdb.usuarios.find(user => user.email === email && user.senha === senha) }
  delete user.senha
  res.status(200).json({ access_token, user })
})

server.get('/public/livros/lancamentos', (req, res) => {
  res.status(200).json([
    {
      autor: 'Tárcio Zemel',
      descricao: 'Técnicas e ferramentas que fazem a diferença nos seus estilos',
      imagem: '/imagens/livros/css.jpg',
      nome: 'CSS Eficiente',
      preco: 29.9
    },
    {
      autor: 'Sass',
      descricao: 'Aprendendo pré-processadores CSS',
      imagem: '/imagens/livros/sass.jpg',
      nome: 'Natan Souza',
      preco: 29.9
    },
    {
      autor: 'Diego Eis',
      descricao: 'O caminho das pedras para ser um dev Front-End',
      imagem: '/imagens/livros/frontend.jpg',
      nome: 'Guia Front-End',
      preco: 29.9
    },
  ])
})

server.get('/public/livros/mais-vendidos', (req, res) => {
  res.status(200).json([
    {
      autor: 'Thiago da Silva Adriano',
      descricao: 'Melhore suas aplicações JavaScript',
      imagem: '/imagens/livros/typescript.jpg',
      nome: 'Guia prático de TypeScript',
      preco: 29.9
    },
    {
      autor: 'Akira Hanashiro',
      descricao: 'A revolucionária linguagem de consulta e manipulação de dados para APIs',
      imagem: '/imagens/livros/graphql.jpg',
      nome: 'GraphQL',
      preco: 29.9
    },
    {
      autor: 'Vinícius Carvalho',
      descricao: 'PostgreSQL',
      imagem: '/imagens/livros/postgre.jpg',
      nome: 'PostgreSQL',
      preco: 29.9
    },
  ])
})

server.use(/^(?!\/public).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Token inválido'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Token de autenticação não encontrado'
      res.status(status).json({ status, message })
      return
    }
    next()
  } catch (err) {
    const status = 401
    const message = 'Token revogado'
    res.status(status).json({ status, message })
  }
})

server.use(router)

server.listen(8000, () => {
  console.log("API disponível em http://localhost:8000")
})
