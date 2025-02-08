const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body } = require("express-validator");
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const goodsIssue = await prisma.dataGoodsIssue.findMany({
    include: {
      detailGoodsIssue: {},
    },
  });
  res.send(goodsIssue);
});

router.get("/bppb", async (req, res) => {
  const bppb = await prisma.bppb.findMany({
    include: {
      detailBppb: {},
    },
  });
  res.send(bppb);
});

router.get("/download", async (req, res) => {
  const { projectId } = req.userData;
  try {
    const material = await prisma.material.findMany({
      where: {
        projectId,
      },
    });

    const goodsIssue = await prisma.dataGoodsIssue.findMany({
      where: {
        projectId,
      },
      include: {
        detailGoodsIssue: {},
      },
    });

    const detailGoodsIssue = [];
    goodsIssue.map((g) => {
      g.detailGoodsIssue.map((d) => {
        detailGoodsIssue.push({
          material: d.material,
          spesifikasi: d.spesifikasi,
          satuan: d.satuan,
          volumeOut: d.volumeOut,
        });
      });
    });

    material.map((m, i) => {
      if (detailGoodsIssue[i] && detailGoodsIssue[i].material) {
        detailGoodsIssue[i].volumeStock = m.volume;
      }
    });

    const pdfPath = path.resolve(process.cwd(), "public/goodsIssue.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    detailGoodsIssue.map((d, i) => {
      page.drawText(`${i + 1}`, {
        x: 80,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.material}`, {
        x: 120,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.spesifikasi}`, {
        x: 360,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.volumeStock}`, {
        x: 535,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.satuan}`, {
        x: 585,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.volumeOut}`, {
        x: 635,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.satuan}`, {
        x: 690,
        y: 485 - i * 13,
        size: 10,
        color: rgb(0, 0, 0),
      });
    });

    const pdfData = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="BPPB.pdf"`);
    res.setHeader("Content-Length", pdfData.length);

    res.end(pdfData);
  } catch (error) {
    console.error("Error populating PDF:", error);
    res.status(500).send("Error populating PDF");
  }
});

router.get("/:goodsIssueId", async (req, res) => {
  const goodsIssue = await prisma.dataGoodsIssue.findUnique({
    where: {
      id: parseInt(req.params.goodsIssueId),
    },
    include: {
      detailGoodsIssue: {},
    },
  });
  res.send(goodsIssue);
});

router.get("/bppb/latest", async (req, res) => {
  const goodsIssue = await prisma.bppb.findFirst({
    orderBy: {
      id: "desc",
    },
    take: 1,
  });

  res.send(goodsIssue);
});

router.get("/bppb/download/:bppbId", async (req, res) => {
  const { projectId } = req.userData;
  try {
    const bppb = await prisma.bppb.findUnique({
      where: {
        id: parseInt(req.params.bppbId),
      },
      include: {
        detailBppb: {},
      },
    });

    const requester = await prisma.user.findUnique({
      where: {
        id: bppb.createdByUserId,
      },
    });

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    const pdfPath = path.resolve(process.cwd(), "public/bppb.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    function getMonthName(index) {
      return months[index];
    }

    page.drawText(`${bppb.kode}`, {
      x: 65,
      y: 468,
      size: 10,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${project.kode}`, {
      x: 90,
      y: 447,
      size: 10,
      color: rgb(0, 0, 0),
    });
    page.drawText(
      `${bppb.createdAt.getDate()} ${getMonthName(
        bppb.createdAt.getMonth()
      )} ${bppb.createdAt.getFullYear()}`,
      {
        x: 290,
        y: 469,
        size: 10,
        color: rgb(0, 0, 0),
      }
    );
    page.drawText(`${project.nama}`, {
      x: 290,
      y: 447,
      size: 10,
      color: rgb(0, 0, 0),
    });

    bppb.detailBppb.map((d, i) => {
      page.drawText(`${d.lokasi}`, {
        x: 72,
        y: 385 - i * 16,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.material}`, {
        x: 185,
        y: 385 - i * 16,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.volume}`, {
        x: 285,
        y: 385 - i * 16,
        size: 10,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.satuan}`, {
        x: 350,
        y: 385 - i * 16,
        size: 10,
        color: rgb(0, 0, 0),
      });
    });

    page.drawText(`${requester.jabatan}`, {
      x: 105,
      y: 195,
      size: 10,
      color: rgb(0, 0, 0),
    });
    page.drawText(`${requester.nama}`, {
      x: 70,
      y: 140,
      size: 10,
      color: rgb(0, 0, 0),
    });

    const pdfData = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="BPPB.pdf"`);
    res.setHeader("Content-Length", pdfData.length);

    res.end(pdfData);
  } catch (error) {
    console.error("Error populating PDF:", error);
    res.status(500).send("Error populating PDF");
  }
});

router.get("/bppb/:bppbId", async (req, res) => {
  const goodsIssue = await prisma.bppb.findUnique({
    where: {
      id: parseInt(req.params.bppbId),
    },
    include: {
      detailBppb: {},
    },
  });

  res.send(goodsIssue);
});

router.post("/", async (req, res) => {
  const { projectId } = req.userData;
  const { data } = req.body;
  const dataGoodsIssue = await prisma.dataGoodsIssue.create({
    data: {
      projectId,
    },
  });

  data.forEach(async (d) => {
    const material = await prisma.material.findFirst({
      where: {
        nama: d.material.toUpperCase(),
        spesifikasi: d.spesifikasi.toUpperCase(),
        satuan: d.satuan.toUpperCase(),
      },
    });

    const updatedMaterialStock = await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        volume: parseInt(material.volume) - parseInt(d.volumeOut),
      },
    });

    if (updatedMaterialStock.volume <= 0) {
      await prisma.material.delete({
        where: {
          id: updatedMaterialStock.id,
        },
      });
    }

    await prisma.detailGoodsIssue.create({
      data: {
        DataGoodsIssueId: dataGoodsIssue.id,
        material: d["material"],
        spesifikasi: d["spesifikasi"],
        volumeOut: parseInt(d["volumeOut"]),
        satuan: d["satuan"],
      },
    });
  });

  res.send(dataGoodsIssue);
});

router.post(
  "/bppb",
  body(["namaPekerja", "lokasi"]).escape(),
  async (req, res) => {
    const { jabatan, id, projectId } = req.userData;
    const { kode, materialsData, namaPekerja } = req.body;
    if (jabatan == "PM" || jabatan == "SEM") {
      return res.send("PM dan SEM tidak bisa membuat BPPB");
    }

    const dataBppb = await prisma.bppb.create({
      data: {
        projectId,
        kode,
        namaPekerja: namaPekerja.toUpperCase(),
        createdByUserId: id,
      },
    });

    materialsData.forEach(async (data) => {
      await prisma.detailBppb.create({
        data: {
          bppbId: dataBppb.id,
          material: data["material"].toUpperCase(),
          spesifikasi: data["spesifikasi"].toUpperCase(),
          volume: parseInt(data["volume"]),
          satuan: data["satuan"].toUpperCase(),
          lokasi: data["lokasi"].toUpperCase(),
        },
      });
    });

    res.send(dataBppb);
  }
);

router.post(
  "/bppb/acc",
  body(["approvalStatus"]).escape(),
  async (req, res) => {
    const { jabatan } = req.userData;
    const { approvalStatus, dataBppbId } = req.body;

    if (jabatan == "LOGISTIK" || jabatan == "PENBAR") {
      const acc = await prisma.bppb.update({
        where: {
          id: dataBppbId,
        },
        data: {
          accStatus: approvalStatus,
        },
      });

      res.send(acc);
    }
  }
);

module.exports = router;
