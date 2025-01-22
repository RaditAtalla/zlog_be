const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { body } = require("express-validator");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const goodsIssue = await prisma.detailGoodsIssue.findMany();
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
    await prisma.detailGoodsIssue.create({
      data: {
        DataGoodsIssueId: dataGoodsIssue.id,
        material: d["material"],
        spesifikasi: d["spesifikasi"],
        volume: parseInt(d["volume"]),
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
        namaPekerja,
        createdByUserId: id,
      },
    });

    materialsData.forEach(async (data) => {
      await prisma.detailBppb.create({
        data: {
          bppbId: dataBppb.id,
          material: data["material"],
          spesifikasi: data["spesifikasi"],
          volume: parseInt(data["volume"]),
          satuan: data["satuan"],
          lokasi: data["lokasi"],
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
