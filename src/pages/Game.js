import { state, images } from '../sketch.js'
import { BasePage, Result } from './index.js'
import { createChunkedArray } from '../utils.js'
import {
  GAME_MODE_ARCADE,
  GAME_MODE_TIMETRIAL,
  GAME_MODE_SURVIVAL,
  YELLOW,
  BLUE,
  MAGENTA,
  ONE_MINUTE,
} from '../constants.js'

const TILE_SIZE = 16
const ROW_SIZE = 32

class PixelTile {
  constructor(tile, index) {
    this.tile = tile
    this.index = index
  }

  draw(drawOptions) {
    const { color, key, keyText } = this.tile
    const { x, y, isRevealed } = drawOptions

    if (!isRevealed) {
      strokeWeight(1)
      stroke(255)
    } else noStroke()

    fill(isRevealed ? color : 0)

    rectMode(CENTER)
    rect(x, y, TILE_SIZE, TILE_SIZE)

    // Buchstabe anzeigen, falls Tile noch nicht aufgedeckt wurde
    if (!isRevealed) {
      noStroke()
      fill(255)
      textAlign(CENTER, CENTER)
      text((keyText || key).toUpperCase(), x + 1, y + 1)
    }
  }
}

export class Game extends BasePage {
  constructor() {
    super()

    this.currentIndex = -1
    this.time = 0
    if (state.currentLevel.mode === 'text') this.timer = ONE_MINUTE * 3
    else this.timer = ONE_MINUTE * 4
    this.timeRemaining = this.timer / 1000
    this.errorCount = 0
    this.score = 0
    this.multiplier = 1
    this.multiplierTime = 1
    this.letterCount = 0
    this.text = 'MISTAKES: '
    this.isInErrorState = false
    this.drawRow = this.drawRow.bind(this)

    const tileCount = ROW_SIZE ** 2

    let tiles = state.currentLevel.tiles
    if (tiles.length > tileCount) tiles = tiles.slice(0, tileCount)

    const pixels = tiles.map((tile, index) => new PixelTile(tile, index))
    const rows = createChunkedArray(pixels, ROW_SIZE)

    this.tiles = tiles
    this.rows = rows
  }

  get nextTile() {
    return this.tiles[this.currentIndex + 1]
  }

  drawRow(row, rowIndex, xCoord) {
    const yFirstRow = 84 + TILE_SIZE / 2

    row.forEach((pixel, columnIndex) =>
      pixel.draw({
        x: xCoord + columnIndex * TILE_SIZE,
        y: yFirstRow + rowIndex * TILE_SIZE,
        isRevealed: this.currentIndex >= pixel.index,
      }),
    )
  }

  drawArcade(xCoord) {
    // Stoppuhr
    if (this.startTime) this.time = (millis() - this.startTime) / 1000
    // Zeit
    fill(255)
    textAlign(CENTER, TOP)
    textSize(20)
    text('TIME', xCoord / 2, 285)
    text('SCORE', width - xCoord / 2, 285)
    textSize(30)
    text(this.time.toFixed(2), xCoord / 2, 335)
    text(this.score, width - xCoord / 2, 335)

    // Live Error Count
    textSize(10)
    fill(255)
    text(this.text + this.errorCount, width / 2, height - 30)
  }

  drawTimetrial(xCoord) {
    // Timer
    if (this.startTime) {
      let spielzeit = millis() - this.startTime
      this.timeRemaining = (this.timer - spielzeit) / 1000
    }

    // Zeit
    fill(255)
    textAlign(CENTER, TOP)
    textSize(20)
    text('TIME LEFT', xCoord / 2, 285)
    text('SCORE', width - xCoord / 2, 285)
    textSize(30)
    text(this.timeRemaining.toFixed(2), xCoord / 2, 335)
    text(this.score, width - xCoord / 2, 335)

    // Live Error Count
    textSize(10)
    fill(255)
    text(this.text + this.errorCount, width / 2, height - 30)
  }

  drawSurvival(xCoord) {
    // Stoppuhr
    if (this.startTime) this.time = (millis() - this.startTime) / 1000
    // Zeit
    fill(255)
    textAlign(CENTER, TOP)
    textSize(20)
    text('TIME', xCoord / 2, 285)
    text('SCORE', width - xCoord / 2, 285)
    textSize(30)
    text(this.time.toFixed(2), xCoord / 2, 335)
    text(this.score, width - xCoord / 2, 335)

    // Herzen für verfügbare Leben hier anzeigen
    imageMode(CENTER)
    if (this.errorCount === 0)
      image(images.HEART_FILLED, width / 2 + 40, 55, 22.3, 18.3)
    else image(images.HEART, width / 2 + 40, 55, 22.3, 18.3)
    if (this.errorCount <= 1)
      image(images.HEART_FILLED, width / 2, 55, 22.3, 18.3)
    else image(images.HEART, width / 2, 55, 22.3, 18.3)
    if (this.errorCount <= 2)
      image(images.HEART_FILLED, width / 2 - 40, 55, 22.3, 18.3)
    else image(images.HEART, width / 2 - 40, 55, 22.3, 18.3)
  }

  draw() {
    const xCoord = width / 2 - ((TILE_SIZE - 0.5) * ROW_SIZE) / 2

    // Error Markierung
    if (this.isInErrorState) {
      rectMode(CENTER)
      fill(0)
      strokeWeight(15)
      stroke(255, 0, 0)
      rect(width / 2, (16 * 32) / 2 + 84, 16 * 32, 16 * 32)
    }

    // Spielbrett
    this.rows.forEach((row, index) => this.drawRow(row, index, xCoord))

    // Spielbrett je nach Modus anpassen
    if (state.currentMode === GAME_MODE_ARCADE) this.drawArcade(xCoord)
    if (state.currentMode === GAME_MODE_TIMETRIAL) this.drawTimetrial(xCoord)
    if (state.currentMode === GAME_MODE_SURVIVAL) this.drawSurvival(xCoord)

    // Timetrial: Game Over wenn Zeit abgelaufen
    if (this.timeRemaining <= 0) this.timeOut()

    // Multiplier anzeigen
    if (this.multiplier === 2) {
      fill(YELLOW)
      textSize(40)
      text('x2', width - 100, 370)
    }
    if (this.multiplier === 3) {
      fill(BLUE)
      textSize(45)
      text('x3', width - 100, 370)
    }
    if (this.multiplier === 4) {
      fill(MAGENTA)
      textSize(50)
      text('x4', width - 100, 370)
    }
  }

  timeOut() {
    state.result.time = this.timeRemaining = 0
    state.result.status = 'GAME OVER'
    state.result.score = this.score
    state.result.tileIndex = this.currentIndex

    state.currentPage = new Result()
  }

  outOfHearts() {
    state.result.time = (millis() - this.startTime) / 1000
    state.result.hearts = 0
    state.result.score = this.score
    state.result.status = 'GAME OVER'

    state.result.tileIndex = this.currentIndex
    state.currentPage = new Result()
  }

  win() {
    // Perfektes Spiel Bonuspunkte
    if (this.errorCount === 0) this.score += 48200
    // Zeit Mulitplier
    if (state.currentMode !== GAME_MODE_TIMETRIAL) {
      let timeBefore = (millis() - this.startTime) / 1000
      if (timeBefore / 32 > 25) this.multiplierTime = 1
      if (timeBefore / 32 <= 20) this.multiplierTime = 2
      if (timeBefore / 32 <= 15) this.multiplierTime = 3
      if (timeBefore / 32 <= 10) this.multiplierTime = 4
    }
    // Ergebnisse speichern
    state.result.time = (millis() - this.startTime) / 1000
    state.result.status = 'YOU WIN'
    // Zusätzlich für Survival Mode
    state.result.hearts = 3 - this.errorCount
    // Timetrial Mode
    if (state.currentMode === GAME_MODE_TIMETRIAL) {
      let timeBefore = 300 - this.timeRemaining
      if (timeBefore / 32 > 10) this.multiplierTime = 1
      if (timeBefore / 32 <= 7) this.multiplierTime = 2
      if (timeBefore / 32 <= 5) this.multiplierTime = 3
      if (timeBefore / 32 <= 3) this.multiplierTime = 4
      state.result.time = this.timeRemaining
    }

    state.result.score = this.score * this.multiplierTime
    state.result.tileIndex = this.currentIndex
    state.currentPage = new Result()
  }

  goNext() {
    this.isInErrorState = false
    this.currentIndex++
    this.letterCount++
    // Multiplier berechnen
    if (this.letterCount > 10) this.multiplier = 2
    if (this.letterCount > 20) this.multiplier = 3
    if (this.letterCount > 30) this.multiplier = 4
    // Score berechnen
    this.score += 50 * this.multiplier
  }

  handleError() {
    if (this.isInErrorState) return

    this.isInErrorState = true
    this.errorCount++
    this.letterCount = 0
    this.multiplier = 1

    if (this.errorCount >= 3 && state.currentMode === GAME_MODE_SURVIVAL)
      this.outOfHearts()
  }

  onKeyPress() {
    if (!this.startTime) this.startTime = millis()

    // Spiel vorbei
    if (this.nextTile) {
      const nextKey = this.nextTile.key
      if (key.toLowerCase() === nextKey) this.goNext()
      else if (keyCode !== SHIFT) this.handleError()
    }

    if (!this.nextTile) this.win()
  }
}
