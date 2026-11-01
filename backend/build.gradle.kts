plugins {
    kotlin("jvm") version "2.1.20"
    application
}
repositories { mavenCentral() }
dependencies {
    implementation("com.google.code.gson:gson:2.11.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("com.google.zxing:core:3.5.3")
    implementation("com.microsoft.onnxruntime:onnxruntime:1.18.0")
    implementation("org.xerial:sqlite-jdbc:3.45.3.0")
    implementation("org.postgresql:postgresql:42.7.2")
    implementation("vn.payos:payos-java:2.0.1")
    // Hardware integrations are loaded only when an operator explicitly selects them.
    implementation("net.java.dev.jna:jna:4.5.2")
    implementation("net.java.dev.jna:jna-platform:4.5.2")
    implementation("com.bitplan:edsdk4j:0.0.1")
    implementation("com.github.sarxos:webcam-capture:0.3.12")
    runtimeOnly("org.slf4j:slf4j-simple:2.0.12")
    testImplementation(kotlin("test-junit5"))
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
kotlin { jvmToolchain(21) }
tasks.test { useJUnitPlatform() }
application {
    mainClass.set("com.lesouvenir.v2.ipc.IpcMainKt")
    applicationName = "backend"
}
tasks.test { dependsOn(tasks.installDist) }
