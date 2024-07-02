import fs from 'fs-extra'

async function copyFonts() {
  try {
    await fs.copy('src/fonts', 'dist/fonts')
  } catch (err) {
    console.error('Error copying fonts:', err)
  }
}

copyFonts()
