import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#FAF8F4',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E0D0',
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#3A2A1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#B8A898',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 2,
  },
  periodLabel: {
    width: 60,
    padding: 6,
    backgroundColor: '#F5F1E8',
    borderRadius: 4,
  },
  cell: {
    flex: 1,
    padding: 6,
    backgroundColor: '#F0E4CC',
    borderRadius: 4,
    minHeight: 48,
  },
  emptyCell: {
    flex: 1,
    padding: 6,
    backgroundColor: '#FAF8F4',
    borderRadius: 4,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E8E0D0',
  },
  cellSubject: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#3A2A1E',
  },
  cellTeacher: {
    fontSize: 7,
    color: '#B8A898',
    marginTop: 2,
  },
  dayHeader: {
    flex: 1,
    padding: 6,
    backgroundColor: '#E8E0D0',
    borderRadius: 4,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    color: '#5C4A3A',
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: '#E8E0D0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#B8A898',
  },
})

interface PDFTimetableProps {
  schoolName: string
  sectionName: string
  gradeName: string
  termName: string
  generatedAt: string
  periodSlots: { label: string; start_time: string; slot_number: number }[]
  slots: {
    day_of_week: number
    slot_number: number
    subject_name: string | null
    teacher_name: string | null
    room_name: string | null
    color_hex: string | null
  }[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export function TimetablePDF({
  schoolName,
  sectionName,
  gradeName,
  termName,
  generatedAt,
  periodSlots,
  slots,
}: PDFTimetableProps) {
  function getSlot(day: number, slotNumber: number) {
    return slots.find((s) => s.day_of_week === day && s.slot_number === slotNumber)
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{gradeName} {sectionName}</Text>
          <Text style={styles.subtitle}>{schoolName} · {termName}</Text>
        </View>

        {/* Day headers */}
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={{ width: 60 }} />
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>

          {/* Period rows */}
          {periodSlots.map((period) => (
            <View key={period.slot_number} style={styles.row}>
              <View style={styles.periodLabel}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: '#5C4A3A', fontSize: 8 }}>
                  {period.label}
                </Text>
                <Text style={{ color: '#B8A898', fontSize: 7, marginTop: 2 }}>
                  {period.start_time?.slice(0, 5)}
                </Text>
              </View>
              {DAYS.map((_, di) => {
                const day = di + 1
                const slot = getSlot(day, period.slot_number)
                if (slot?.subject_name) {
                  return (
                    <View key={day} style={styles.cell}>
                      <Text style={styles.cellSubject}>{slot.subject_name}</Text>
                      {slot.teacher_name && (
                        <Text style={styles.cellTeacher}>{slot.teacher_name}</Text>
                      )}
                      {slot.room_name && (
                        <Text style={styles.cellTeacher}>{slot.room_name}</Text>
                      )}
                    </View>
                  )
                }
                return <View key={day} style={styles.emptyCell} />
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{schoolName}</Text>
          <Text style={styles.footerText}>{termName}</Text>
          <Text style={styles.footerText}>Generated {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}
