const express = require('express')
const bcrypt = require('bcrypt')
const { PrismaClient } = require("@prisma/client")
const { body } = require('express-validator')
const jwt = require('jsonwebtoken')

const router = express.Router()
const prisma = new PrismaClient()

router.get("/", accessValidation, (req, res) => {
  const { id, nama } = req.userData
  res.send("Current user: " + id + " " + nama)
})

router.post("/register", body(["nama", "nomorHp", "email", "password", "jabatan"]).escape(), async (req, res) => {
  // register akun pekerja
  const nama = req.body.nama
  const nomorHp = req.body.nomorHp
  const email = req.body.email
  const password = req.body.password
  const jabatan = req.body.jabatan

  const salt = await bcrypt.genSalt()
  const hashedPassword = await bcrypt.hash(password, salt)
  const user = await prisma.user.create({
    data: {
      nama,
      nomorHp,
      email,
      password: hashedPassword,
      jabatan
    }
  })

  res.send(user)
})

router.post("/login", body(["email", "password"]).escape(), async (req, res) => {
  // login akun pekerja
  const email = req.body.email
  const password = req.body.password

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  })

  const project = await prisma.picProject.findUnique({
    where: {
      userId: user.id
    }
  })

  const isEmailCorrect = email == user.email;
  const isPasswordCorrect = await bcrypt.compare(password, user.password)

  if (isEmailCorrect && isPasswordCorrect) {
    const userData = {id: user.id, nama: user.nama, nomorHp: user.nomorHp, email: user.email, jabatan: user.jabatan, projectId: project.projectId}
    const token = jwt.sign(userData, process.env.JWT_ACCESS_TOKEN)

    res.send(token)
  } else {
    res.send("login failed")
  }
})

function accessValidation(req, res, next) {
  const {authorization} = req.headers
  if(!authorization) {
    return res.send("Please log in")
  }

  const token = authorization.split(" ")[1]
  const secret = process.env.JWT_ACCESS_TOKEN

  try {
    const jwtDecode = jwt.verify(token, secret)
    req.userData = jwtDecode
  } catch (error) {
    return res.send("Wrong token")
  }

  next()
}

module.exports = {router, accessValidation}