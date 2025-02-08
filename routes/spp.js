const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body } = require("express-validator");
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { id, projectId } = req.userData;
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  const sppNoAcc2 = await prisma.dataSpp.findMany({
    where: {
      acc2Status: "WAITING",
    },
  });
  const sppNoAcc1 = await prisma.dataSpp.findMany({
    where: {
      acc2Status: "APPROVED" || "NOT_APPROVED",
      acc1Status: "WAITING",
    },
  });

  if (id == project.sppAcc2Id) {
    return res.send(sppNoAcc2);
  } else if (id == project.sppAcc1Id) {
    return res.send(sppNoAcc1);
  } else {
    return res.send([]);
  }
});

router.get("/all", async (req, res) => {
  const spp = await prisma.dataSpp.findMany({
    include: {
      detailSpp: {},
    },
  });
  res.send(spp);
});

router.get("/latest", async (req, res) => {
  const latestSpp = await prisma.dataSpp.findFirst({
    orderBy: {
      id: "desc",
    },
    take: 1,
  });

  res.send(latestSpp);
});

router.get("/download/:sppId", async (req, res) => {
  const { projectId } = req.userData;
  const { sppId } = req.params;
  try {
    const spp = await prisma.dataSpp.findUnique({
      where: {
        id: parseInt(sppId),
      },
      include: {
        detailSpp: {},
      },
    });

    const data = spp.detailSpp;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    const acc1 = await prisma.user.findUnique({
      where: {
        id: project.sppAcc1Id,
      },
    });

    const acc2 = await prisma.user.findUnique({
      where: {
        id: project.sppAcc2Id,
      },
    });

    const createdBy = await prisma.user.findUnique({
      where: {
        id: spp.createdByUserId,
      },
    });

    function changeSlashToDash(filename) {
      return filename.replace(/[\/\\]/g, "_");
    }

    const pdfPath = path.resolve(process.cwd(), "public/formSPP.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    page.drawText(`${project.nama}`, {
      x: 80,
      y: 699,
      size: 8,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${project.lokasi}`, {
      x: 413,
      y: 699,
      size: 8,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${spp.kode}`, {
      x: 413,
      y: 688,
      size: 8,
      color: rgb(0, 0, 0),
    });

    data.map((d, i) => {
      page.drawText(`${i + 1}`, {
        x: 45,
        y: 641 - i * 9,
        size: 6,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.material}`, {
        x: 75,
        y: 641 - i * 9,
        size: 6,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.volume}`, {
        x: 225,
        y: 641 - i * 9,
        size: 6,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.satuan}`, {
        x: 255,
        y: 641 - i * 9,
        size: 6,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.spesifikasi}`, {
        x: 285,
        y: 641 - i * 9,
        size: 6,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.lokasi}`, {
        x: 410,
        y: 641 - i * 9,
        size: 6,
        color: rgb(0, 0, 0),
      });
    });

    page.drawText(`${acc1.nama}`, {
      x: 70,
      y: 380,
      size: 8,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${acc2.nama}`, {
      x: 220,
      y: 380,
      size: 8,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${createdBy.nama}`, {
      x: 445,
      y: 380,
      size: 8,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${createdBy.jabatan}`, {
      x: 455,
      y: 373,
      size: 8,
      color: rgb(0, 0, 0),
    });

    const pdfData = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${changeSlashToDash(spp.kode)}"`
    );
    res.setHeader("Content-Length", pdfData.length);

    res.end(pdfData);
  } catch (error) {
    console.error("Error populating PDF:", error);
    res.status(500).send("Error populating PDF");
  }
});

router.get("/:sppId", async (req, res) => {
  const spp = await prisma.dataSpp.findUnique({
    where: {
      id: parseInt(req.params.sppId),
    },
    include: {
      detailSpp: {},
    },
  });

  res.send(spp);
});

router.post("/", async (req, res) => {
  const { jabatan, id, projectId } = req.userData;
  const { kode } = req.body;
  if (jabatan == "PM" || jabatan == "SEM") {
    return res.send("PM dan SEM tidak bisa membuat SPP");
  }

  // upload to DataSPP
  const dataSpp = await prisma.dataSpp.create({
    data: {
      projectId,
      kode,
      createdByUserId: id,
    },
  });

  // receives array of objects [{}, {}, ..]
  const data = req.body.data;
  data.forEach(async (data) => {
    await prisma.detailSpp.create({
      data: {
        material: data["material"].toUpperCase(),
        spesifikasi: data["spesifikasi"].toUpperCase(),
        volume: parseInt(data["volume"]),
        satuan: data["satuan"].toUpperCase(),
        lokasi: data["lokasi"].toUpperCase(),
        dataSppId: dataSpp.id,
      },
    });
  });

  res.send(dataSpp);
});

router.post(
  "/acc",
  body(["approvalStatus, dataSppId"]).escape(),
  async (req, res) => {
    const { id, projectId } = req.userData;
    const { approvalStatus, dataSppId } = req.body;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    const dataSpp = await prisma.dataSpp.findUnique({
      where: {
        id: dataSppId,
      },
    });

    const acc2Status = dataSpp.acc2Status;

    const userAcc1 = await prisma.user.findUnique({
      where: {
        id: project.sppAcc1Id,
      },
    });
    const userAcc2 = await prisma.user.findUnique({
      where: {
        id: project.sppAcc2Id,
      },
    });

    if (id == userAcc2.id) {
      const acc2 = await prisma.dataSpp.update({
        where: {
          id: dataSppId,
        },
        data: {
          acc2Status: approvalStatus,
          acc2At: new Date(),
        },
      });

      res.send(acc2);
    } else if (id == userAcc1.id && acc2Status == "APPROVED") {
      const acc1 = await prisma.dataSpp.update({
        where: {
          id: dataSppId,
        },
        data: {
          acc1Status: approvalStatus,
          acc1At: new Date(),
          sppStatus: approvalStatus == "APPROVED" ? "APPROVED" : "NOT_APPROVED",
        },
      });

      res.send(acc1);
    } else {
      res.send("Nothing to see here");
    }
  }
);

module.exports = router;
