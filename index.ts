import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";

import { JSONFilePreset } from "lowdb/node";

import type { TUser, TVisa } from "./user.js";

const app = express();
const port = 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.options("*", cors());

app.use(express.json());

const saltRounds = 10;

app.get("/users", async (_, res) => {
  try {
    const db = await JSONFilePreset("data.json", {});
    const data = db.data as TUser[];
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const db = await JSONFilePreset("data.json", {});
    const data = db.data as TUser[];
    const id = req.params.id;
    const user = data.find((u) => String(u._id) === id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
});

app.patch("/users/:id", async (req, res) => {
  try {
    const db = await JSONFilePreset("data.json", {});
    const data = db.data as TUser[];

    const userFields = req.body.userFields;
    const userId = req.params.id;
    const managerId = userFields?.manager;

    const visaIssuingCountry = userFields?.issuing_country;
    const visaType = userFields?.visa_type;
    const visaStartDate = userFields?.start_date;
    const visaEndDate = userFields?.end_date;
    const newManager = data.find((u) => u._id === managerId);
    const calledBy = req.body.calledBy;

    const user = data.find((u) => u._id === userId);

    if (calledBy.role !== "admin" && calledBy.id !== user?.manager?.id) {
      res.status(403).json({
        status: "error",
        message: "No permission for such action",
      });
      return;
    }

    if (managerId && !newManager) {
      res.status(404).json({
        status: "error",
        message: "No user with such Id",
      });
      return;
    }
    if (newManager) {
      newManager.role = "hr";
    }

    const index = data.findIndex((u) => u._id === userId);

    if (index === -1) {
      return res.status(404).json({ message: "User not found" });
    }
    let updatedUser = { ...data[index] };
    updatedUser = { ...updatedUser, ...userFields };

    if (managerId) {
      updatedUser = {
        ...data[index],
        ...userFields,
        manager: {
          id: managerId,
          first_name: newManager?.first_name,
          last_name: newManager?.last_name,
        },
      };
    }
    if (visaType || visaEndDate || visaStartDate) {
      const updatedVisa: TVisa = {
        issuing_country:
          visaIssuingCountry ?? updatedUser.visa?.[0]?.issuing_country ?? "",
        type: visaType ?? updatedUser.visa?.[0]?.type ?? "",
        start_date: visaStartDate ?? updatedUser.visa?.[0]?.start_date ?? "",
        end_date: visaEndDate ?? updatedUser.visa?.[0]?.end_date ?? "",
      };

      updatedUser = {
        ...data[index],
        ...userFields,
        visa: [updatedVisa],
      };
    }

    data[index] = updatedUser;
    await db.write();

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      user: data[index],
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Something went wrong!" });
  }
});

app.post("/sign-in", async (req, res) => {
  const db = await JSONFilePreset("data.json", {});
  const data = db.data as TUser[];
  try {
    const { email, password } = req.body;

    const user = data.find((u) => u.email === email);

    if (!user) {
      return res.status(404).json({ message: "Invalid Credentials" });
    }

    const isMatching = await bcrypt.compare(password, user.password);

    if (!isMatching) {
      return res.status(404).json({ message: "Invalid Credentials" });
    }

    return res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/sign-up", async (req, res) => {
  try {
    const db = await JSONFilePreset("data.json", {});
    const data = db.data as TUser[];
    const user = req.body;
    const email = user.email;

    if (data.find((u) => u.email === email)) {
      return res.status(409).json({
        status: "Conflict",
        message: `User with email "${email}" already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    data.push({ ...user, password: hashedPassword });
    await db.write();

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Something went wrong!" });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
