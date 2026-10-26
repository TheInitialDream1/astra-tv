# AdbLib

Source: https://github.com/cgutman/AdbLib
Revision: d6937951eb98557c76ee2081e383d50886ce109a
License: BSD-3-Clause, copyright Cameron Gutman (2013); full text in LICENSE and APK licenses/adblib-bsd-3-clause.txt.

Reused five protocol classes under android/app/src/main/java/com/cgutman/adblib/.
Local changes: queue draining before EOF in AdbStream, an authentication callback in AdbConnection, and ASTRA@TV public-key comment in AdbCrypto. Transport is only to the running TV's loopback ADB daemon, using an independent app-private key approved by Android. No host private key is copied.
