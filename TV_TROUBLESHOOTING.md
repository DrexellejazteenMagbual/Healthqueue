# Smart TV Troubleshooting Guide

## ✅ Server Status
- Production server running on port 8080
- Firewall rule enabled
- SPA routing configured
- /tv route verified working

## 📺 Try These URLs on Your Smart TV

### Primary URL (Queue Display):
```
http://192.168.1.8:8080/tv
```

### Alternative URLs:
```
http://192.168.1.8:8080
http://192.168.56.1:8080/tv
http://192.168.56.1:8080
```

---

## 🔍 Troubleshooting Steps

### Step 1: Check Network Connection
**On your Smart TV:**
1. Go to **Settings** → **Network** → **Network Status**
2. Check the IP address shown
3. **It should start with `192.168.1.xxx`** (same as your PC)
4. If it shows `192.168.56.xxx`, use the alternative URL above

### Step 2: Test from Your Phone First
**This confirms the server is accessible:**
1. Connect your phone to the **same Wi-Fi network** as the TV
2. Open a browser on your phone
3. Go to: `http://192.168.1.8:8080/tv`
4. If it works on phone ✅ → The problem is TV-specific
5. If it doesn't work on phone ❌ → Network or firewall issue

### Step 3: Check Router Settings
**Some routers have "AP Isolation" or "Client Isolation":**
1. Open router admin panel (usually http://192.168.1.1)
2. Look for settings like:
   - AP Isolation
   - Client Isolation
   - Wireless Isolation
3. **Turn these OFF** if enabled
4. Try accessing from TV again

### Step 4: TV Browser Issues
**Smart TV browsers can be outdated:**

**Option A - Update TV Firmware:**
1. Go to TV Settings → About → Software Update
2. Check for updates and install

**Option B - Try Different URL Format:**
Instead of `http://192.168.1.8:8080/tv`, try:
```
http://192.168.1.8:8080/index.html#/tv
http://192.168.1.8:8080/#/tv
```

**Option C - Use TV's Built-in Apps:**
Some Smart TVs have better browsers in their app store:
- Look for "Web Browser" or "Internet Browser" app
- Or search for "Chrome", "Firefox", "Opera" in TV app store

### Step 5: Network Diagnostics
**Check if TV can reach your PC:**
1. On your Smart TV browser, try: `http://192.168.1.8:8080`
2. If you see ANYTHING (even error), the network works ✅
3. If it says "Cannot connect" or "Timeout", check:
   - Both devices on same Wi-Fi SSID
   - TV not using Guest Wi-Fi network
   - Router not blocking device communication

### Step 6: Windows Firewall Public Profile
**If TV is detected as "Public" network:**
Run this on PC (as Administrator):
```powershell
netsh advfirewall firewall add rule name="HealthQueue Port 8080 Public" dir=in action=allow protocol=TCP localport=8080 profile=public
```

---

## 🎯 Quick Checklist

- [ ] Server running on port 8080 (verified ✅)
- [ ] Firewall rule added (verified ✅)
- [ ] TV connected to same Wi-Fi as PC
- [ ] TV IP is 192.168.1.xxx (same subnet as PC)
- [ ] Tested from phone on same network
- [ ] Router AP Isolation is OFF
- [ ] TV browser is updated
- [ ] Tried alternative URLs

---

## 🆘 If Still Not Working

### Last Resort Options:

**Option 1: Use a Laptop/Tablet**
Connect a laptop or tablet to the TV via HDMI and use that browser.

**Option 2: Chromecast/Miracast**
Cast your PC screen to the Smart TV.

**Option 3: Direct Connection**
Connect PC and TV with ethernet cable directly (may need crossover cable or network switch).

---

## 📞 Need More Help?

**Check these details:**
1. What is your TV's IP address? (From TV Settings → Network)
2. What is your PC's IP address? (192.168.1.8 or 192.168.56.1)
3. Are they on the same network (192.168.1.x)?
4. What happens when you try to access the URL on TV?
   - "Cannot connect"
   - "Webpage not available"
   - Blank page
   - Error message (what does it say?)
5. Can you access it from your phone on same Wi-Fi?

---

## 🔄 Restart Everything

If all else fails, restart in this order:
1. Stop servers (see commands below)
2. Restart PC
3. Restart Router
4. Restart TV
5. Restart servers
6. Try again

**Commands to restart servers:**
```powershell
# Stop server
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start server
cd C:\healthqueue-system\build
http-server -p 8080 -a 0.0.0.0 --proxy http://localhost:8080? --cors
```
