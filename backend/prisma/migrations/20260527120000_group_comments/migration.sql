-- CreateTable
CREATE TABLE "group_comments" (
  "id" TEXT NOT NULL,
  "content" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "group_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "group_comments"
ADD CONSTRAINT "group_comments_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_comments"
ADD CONSTRAINT "group_comments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
