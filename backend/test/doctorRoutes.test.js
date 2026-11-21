import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import test from 'node:test'
import Doctor from '../models/Doctor.js'
import { getFeaturedDoctors } from '../controllers/doctorController.js'
import doctorRoutes from '../routes/doctorRoutes.js'

test('featured doctors are limited to five public fields', async () => {
  const originalFind = Doctor.find
  const doctors = Array.from({ length: 6 }, (_, index) => ({
    _id: `doctor-${index + 1}`,
    order: index + 1,
    name: `Doctor ${index + 1}`,
    image: `doctor-${index + 1}.png`,
    speciality: 'Cardiology',
    division: 'Dhaka',
    fees: 1000,
    address: { line1: 'Private address', line2: 'Private details' },
  }))
  let selectedFields
  let sortedFields
  let resultLimit

  Doctor.find = () => ({
    select(fields) {
      selectedFields = fields
      return this
    },
    sort(fields) {
      sortedFields = fields
      return this
    },
    limit(limit) {
      resultLimit = limit
      return this
    },
    lean() {
      return Promise.resolve(doctors.slice(0, resultLimit))
    },
  })

  try {
    let responseBody
    await getFeaturedDoctors({}, {
      json(body) {
        responseBody = body
      },
    }, (error) => {
      throw error
    })

    assert.equal(selectedFields, '_id name image speciality division')
    assert.deepEqual(sortedFields, { order: 1 })
    assert.equal(resultLimit, 5)
    assert.equal(responseBody.length, 5)
    assert.deepEqual(Object.keys(responseBody[0]), [
      '_id',
      'name',
      'image',
      'speciality',
      'division',
    ])
    assert.equal(responseBody[0].fees, undefined)
    assert.equal(responseBody[0].address, undefined)
  } finally {
    Doctor.find = originalFind
  }
})

test('the full doctors endpoint rejects unauthenticated requests', async () => {
  const app = express()
  app.use('/api/doctors', doctorRoutes)

  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const { port } = server.address()
    const response = await fetch(`http://127.0.0.1:${port}/api/doctors`)

    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), {
      message: 'Authentication is required.',
    })
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve())
    })
  }
})
