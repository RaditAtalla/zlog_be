const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body } = require("express-validator");
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const goodsReceipt = await prisma.goodsReceipt.findMany({
    include: {
      goodsReceiptDetail: {},
    },
  });
  res.send(goodsReceipt);
});

router.get("/latest", async (req, res) => {
  const goodsReceipt = await prisma.goodsReceipt.findFirst({
    orderBy: {
      id: "desc",
    },
    take: 1,
  });

  res.send(goodsReceipt);
});

router.get("/download", async (req, res) => {
  const { projectId } = req.userData;
  try {
    const goodsReceipt = await prisma.goodsReceipt.findMany({
      where: {
        projectId,
      },
      include: {
        goodsReceiptDetail: {},
      },
    });

    const data = [];
    goodsReceipt.map((g) => {
      g.goodsReceiptDetail.map((d) => {
        data.push({
          noMaterialMasuk: g.noMaterialMasuk,
          noSuratJalan: g.noSuratJalan,
          vendor: g.vendor,
          material: d.material,
          spesifikasi: d.spesifikasi,
          volume: d.volume,
          satuan: d.satuan,
        });
      });
    });

    const pdfPath = path.resolve(process.cwd(), "public/goodsReceipt.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    data.map((d, i) => {
      page.drawText(`${d.noMaterialMasuk}`, {
        x: 72,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.noSuratJalan}`, {
        x: 110,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.vendor}`, {
        x: 195,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.material}`, {
        x: 340,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.spesifikasi}`, {
        x: 540,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.volume}`, {
        x: 680,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${d.satuan}`, {
        x: 725,
        y: 483 - i * 10,
        size: 8,
        color: rgb(0, 0, 0),
      });
    });

    const pdfData = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="GoodsReceipt.pdf"`
    );
    res.setHeader("Content-Length", pdfData.length);

    res.end(pdfData);
  } catch (error) {
    console.error("Error populating PDF:", error);
    res.status(500).send("Error populating PDF");
  }
});

router.get("/:goodsReceiptId", async (req, res) => {
  const goodsReceipt = await prisma.goodsReceipt.findUnique({
    where: {
      id: parseInt(req.params.goodsReceiptId),
    },
    include: {
      goodsReceiptDetail: {},
    },
  });

  res.send(goodsReceipt);
});

router.post(
  "/",
  body(["vendor", "namaPengantar"]).escape(),
  async (req, res) => {
    const { jabatan, projectId } = req.userData;
    const {
      noMaterialMasuk,
      noSuratJalan,
      tanggalMasuk,
      vendor,
      namaPengantar,
      data,
    } = req.body;

    if (jabatan == "POP" || jabatan == "LOGISTIK" || jabatan == "PENBAR") {
      const goodsReceipt = await prisma.goodsReceipt.create({
        data: {
          noMaterialMasuk: noMaterialMasuk.toUpperCase(),
          noSuratJalan: noSuratJalan.toUpperCase(),
          tanggalMasuk,
          vendor: vendor.toUpperCase(),
          namaPengantar: namaPengantar.toUpperCase(),
          projectId,
        },
      });

      data.forEach(async (data) => {
        await prisma.goodsReceiptDetail.create({
          data: {
            goodsReceiptId: goodsReceipt.id,
            material: data["material"].toUpperCase(),
            spesifikasi: data["spesifikasi"].toUpperCase(),
            volume: parseInt(data["volume"]),
            satuan: data["satuan"].toUpperCase(),
          },
        });
      });

      return res.send(goodsReceipt);
    }

    res.send("forbidden");
  }
);

module.exports = router;
