plugins {
    kotlin("jvm") version "2.1.20"
    application
}
repositories { mavenCentral() }
dependencies {
    implementation("com.google.code.gson:gson:2.11.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
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
