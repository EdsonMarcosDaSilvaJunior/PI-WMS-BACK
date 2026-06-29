import * as movementService from "../services/movementService.js";

export async function createMovement(req, res) {

  try {

    const movement = await movementService.createMovement(req.body);

    res.status(201).json(movement);

  } catch (error) {

    res.status(400).json({
      error: error.message
    });

  }
}