import * as XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

async function globalSetup() {
  // Create sample import xlsx for Playwright tests
  const fixturesDir = path.join(__dirname)
  fs.mkdirSync(fixturesDir, { recursive: true })

  const data = [
    { Name: 'Alice Smith', Email: 'alice@school.edu', Subjects: 'Math,Science', Grades: 'Grade 6,Grade 7', MaxPeriods: 6 },
    { Name: 'Bob Jones', Email: 'bob@school.edu', Subjects: 'English,History', Grades: 'Grade 6', MaxPeriods: 5 },
    { Name: 'Carol White', Email: 'carol@school.edu', Subjects: 'Art,Music', Grades: 'Grade 7,Grade 8', MaxPeriods: 4 },
  ]

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Teachers')
  XLSX.writeFile(wb, path.join(fixturesDir, 'sample-import.xlsx'))
}

export default globalSetup
