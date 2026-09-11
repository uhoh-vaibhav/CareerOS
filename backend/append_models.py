with open("prisma/schema.prisma", "a", encoding="utf-8") as f:
    f.write("""
model CoverLetter {
  id             String         @id @default(uuid())
  profileId      String
  profile        StudentProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  jobTitle       String?
  jobDescription String
  content        String
  createdAt      DateTime       @default(now())

  @@map("cover_letters")
}

model DailyChallenge {
  id          String         @id @default(uuid())
  profileId   String
  profile     StudentProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  date        String         // YYYY-MM-DD
  questions   Json           // Array of generated MCQs and options
  score       Int?           // Score out of 3
  isCompleted Boolean        @default(false)
  createdAt   DateTime       @default(now())

  @@unique([profileId, date])
  @@map("daily_challenges")
}
""")
