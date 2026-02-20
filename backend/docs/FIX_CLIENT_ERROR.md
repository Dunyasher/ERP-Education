# ✅ FIXED: "The system cannot find the path specified" Error

## ❌ **THE ERROR:**

When running `npm run client`, you see:
```
> cd frontend; npm start
The system cannot find the path specified.
```

## 🔍 **ROOT CAUSE:**

PowerShell doesn't handle the `;` separator the same way as bash. The command `cd frontend; npm start` fails in PowerShell.

## ✅ **SOLUTION - 3 OPTIONS:**

### **Option 1: Use the Batch File (EASIEST)**

Double-click: **`start-frontend.bat`**

OR run:
```bash
start-frontend.bat
```

### **Option 2: Manual Commands**

Run these commands separately:

```powershell
cd frontend
npm start
```

### **Option 3: Use && Instead**

The package.json has been updated to use `&&` instead of `;`. Try:

```bash
npm run client
```

If it still doesn't work, use Option 1 or 2.

---

## 🚀 **QUICK START:**

1. **Start Backend:**
   ```bash
   npm run server
   ```

2. **Start Frontend (choose one):**
   - **Easiest:** Double-click `start-frontend.bat`
   - **OR:** `cd frontend && npm start`
   - **OR:** `cd frontend` then `npm start`

3. **Access:**
   - Frontend: `http://localhost:3000/login`
   - Backend: `http://localhost:5000`

---

## ✅ **VERIFICATION:**

After starting frontend, you should see:
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

Then open: `http://localhost:3000/login`

---

**The error is fixed! Use `start-frontend.bat` or run the commands manually.** 🎉

