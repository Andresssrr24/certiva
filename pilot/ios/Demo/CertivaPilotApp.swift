import SwiftUI
import PhotosUI
import CertivaSDK

private let brand = Color(red: 32/255, green: 80/255, blue: 148/255)

@main
struct CertivaPilotApp: App {
    var body: some Scene { WindowGroup { PilotView().tint(brand) } }
}

@MainActor
final class PilotAPI: ObservableObject {
    @Published var loggedIn = false
    private var csrf = ""
    private let session = URLSession(configuration: .ephemeral)
    // Development sample: loopback only. Real bank authentication belongs to the host.
    private let base = URL(string: "http://127.0.0.1:4320")!
    func request(_ path: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        var request = URLRequest(url: base.appendingPathComponent(path))
        request.httpMethod = method; request.httpBody = body; request.timeoutInterval = 15
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(csrf, forHTTPHeaderField: "X-CSRF-Token")
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            if (response as? HTTPURLResponse)?.statusCode == 401 { loggedIn = false; csrf = "" }
            let error = (try? JSONSerialization.jsonObject(with: data)) as? [String: String]
            throw NSError(domain: "Certiva", code: 1, userInfo: [NSLocalizedDescriptionKey: error?["error"] ?? "No se pudo contactar el servidor local."])
        }
        return data
    }
    func login(username: String, password: String) async throws {
        let data = try await request("api/login", method: "POST", body: JSONSerialization.data(withJSONObject: ["username": username, "password": password]))
        let result = try JSONSerialization.jsonObject(with: data) as? [String: String]
        guard result?["role"] == "cliente", let token = result?["csrf"] else {
            throw NSError(domain: "Certiva", code: 2, userInfo: [NSLocalizedDescriptionKey: "Usa un acceso de cliente. La consola web es para analistas y auditores."])
        }
        csrf = token; loggedIn = true
    }
    func logout() async throws { _ = try await request("api/logout", method: "POST"); loggedIn = false; csrf = "" }
}
private struct PilotCase: Decodable, Identifiable {
    let id: String
    let state: String
    let created: Double
}
private struct CaseList: Decodable { let cases: [PilotCase] }

struct PilotView: View {
    @StateObject private var api = PilotAPI()
    @State private var text = ""
    @State private var channel = "whatsapp"
    @State private var source = "texto"
    @State private var readingConfirmed = false
    @State private var assessment: CertivaAssessment?
    @State private var engine: CertivaEngine?
    @State private var photo: PhotosPickerItem?
    @State private var busy = false
    @State private var errorMessage: String?
    @State private var reportSheet = false
    @State private var consent = false
    @State private var caseID: String?
    @State private var username = "cliente"
    @State private var password = ""
    @State private var cases: [PilotCase] = []
    @State private var tab = 0

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        HStack(spacing: 8) {
                            ZStack(alignment: .topLeading) { Image("CertivaBrand").resizable().frame(width: 308, height: 205.34).offset(x: -76.8, y: -13) }.frame(width: 44, height: 46, alignment: .topLeading).clipped().clipShape(RoundedRectangle(cornerRadius: 12)).accessibilityHidden(true)
                            Text("certiva").font(.system(size: 36, weight: .heavy, design: .rounded)).foregroundStyle(brand); Spacer(); Text("PILOTO").font(.caption.bold()).padding(8).background(brand.opacity(0.08)).clipShape(Capsule())
                        }
                        Text("Antes de responder, verifica.").font(.largeTitle.bold())
                        Text("Revisa un mensaje antes de compartir datos o seguir instrucciones de pago.").foregroundStyle(.secondary)
                        VStack(alignment: .leading, spacing: 15) {
                            Picker("Canal", selection: $channel) {
                                Text("WhatsApp").tag("whatsapp"); Text("SMS").tag("sms"); Text("Correo").tag("correo"); Text("Otro").tag("otro")
                            }.pickerStyle(.segmented).disabled(busy)
                            Text("Texto del mensaje").font(.headline)
                            TextEditor(text: $text).frame(minHeight: 170).padding(6).background(.white).clipShape(RoundedRectangle(cornerRadius: 10)).disabled(busy).accessibilityIdentifier("message")
                            PhotosPicker(selection: $photo, matching: .images) { Label("Leer una captura", systemImage: "photo") }.disabled(busy)
                            if source == "apple_vision" {
                                Text("Lectura local con Apple Vision. Compara el texto con la captura y corrige posibles errores.").font(.caption).foregroundStyle(.secondary)
                                Toggle("Revisé que el texto coincide", isOn: $readingConfirmed)
                            }
                            Button("Probar un mensaje de ejemplo") {
                                source = "texto"; text = "Su cuenta será bloqueada hoy. Envíe el código de verificación para desbloquearla."
                            }.font(.caption).disabled(busy)
                            Button { analyze() } label: { Label("Verificar mensaje", systemImage: "checkmark.shield").frame(maxWidth: .infinity).padding(7) }.buttonStyle(.borderedProminent).disabled(busy || engine == nil || text.isEmpty).accessibilityIdentifier("analyze")
                            Text("El contenido se analiza en este dispositivo y no se envía al servidor. No ingreses contraseñas ni códigos privados.").font(.caption).foregroundStyle(.secondary)
                        }.padding(18).background(brand.opacity(0.05)).clipShape(RoundedRectangle(cornerRadius: 20))
                        if busy { ProgressView("Procesando…") }
                        if let result = assessment {
                            VStack(alignment: .leading, spacing: 14) {
                                Text(result.title).font(.title2.bold())
                                ForEach(result.reasons) { reason in Label(reason.title, systemImage: "exclamationmark.circle") }
                                Text(result.action)
                                Text("Cobertura: reglas de texto. No autentica al remitente.").font(.caption).foregroundStyle(.secondary)
                                if let id = caseID { Label("Reporte recibido · \(id.prefix(8))", systemImage: "checkmark.circle").foregroundStyle(brand) }
                                else { Button("Revisar datos y reportar") { consent = false; reportSheet = true }.buttonStyle(.bordered).accessibilityIdentifier("report") }
                            }.padding(20).frame(maxWidth: .infinity, alignment: .leading).background(.white).clipShape(RoundedRectangle(cornerRadius: 20))
                        }
                        Text("Caja de Ahorros es una referencia de pruebas. Sin conexión al banco. La configuración necesita aprobación institucional.").font(.caption).foregroundStyle(.secondary)
                    }.padding(22)
                }.background(Color(red: 0.96, green: 0.97, blue: 0.99)).navigationTitle("Tu aliado contra el fraude").navigationBarTitleDisplayMode(.inline)
            }.tabItem { Label("Verificar", systemImage: "shield") }.tag(0)
            NavigationStack {
                List {
                    if !api.loggedIn { Section("Acceso de cliente al piloto local") { loginFields } }
                    else {
                        Section { Button("Actualizar reportes") { Task { await loadCases() } }; Button("Cerrar sesión", role: .destructive) { Task { do { try await api.logout(); cases = []; text = ""; assessment = nil; password = "" } catch { errorMessage = error.localizedDescription } } } }
                        Section("Tus reportes") {
                            if cases.isEmpty { Text("Aún no hay reportes. Verifica un mensaje y decide si quieres enviarlo.").foregroundStyle(.secondary) }
                            ForEach(cases) { item in VStack(alignment: .leading, spacing: 6) { Text("Caso \(item.id.prefix(8))").font(.headline); Text(item.state.replacingOccurrences(of: "_", with: " ")).foregroundStyle(.secondary); Text(Date(timeIntervalSince1970: item.created / 1000), style: .date).font(.caption) } }
                        }
                    }
                }.navigationTitle("Mis reportes").refreshable { if api.loggedIn { await loadCases() } }
            }.tabItem { Label("Reportes", systemImage: "tray") }.tag(1)
        }
        .task { do { engine = try CertivaEngine() } catch { errorMessage = error.localizedDescription } }
        .onChange(of: text) { _ in assessment = nil; caseID = nil; readingConfirmed = false }
        .onChange(of: channel) { _ in assessment = nil; caseID = nil }
        .onChange(of: readingConfirmed) { _ in assessment = nil; caseID = nil }
        .onChange(of: photo) { item in
            guard let item else { return }
            busy = true
            Task {
                do {
                    guard let data = try await item.loadTransferable(type: Data.self) else { throw CertivaError.unreadableImage }
                    let extracted = try await CertivaEngine.readImage(data)
                    text = extracted; source = "apple_vision"; readingConfirmed = false
                } catch { errorMessage = error.localizedDescription }
                busy = false; photo = nil
            }
        }
        .sheet(isPresented: $reportSheet) {
            NavigationStack {
                Form {
                    Section("Esto es lo que se enviará") {
                        if let result = assessment {
                            Text(result.title); Text("Canal: \(result.channel)")
                            ForEach(result.reasons) { Text($0.title) }
                            Text("Fecha del análisis y versiones del SDK y la configuración.")
                            Text("No se enviarán el mensaje, la imagen, enlaces, números ni códigos.").font(.caption)
                        }
                    }
                    if !api.loggedIn { Section("Inicia sesión para reportar") { loginFields } }
                    Section {
                        Toggle("Quiero enviar estos datos para revisión", isOn: $consent)
                        Button("Enviar reporte") { Task { await sendReport() } }.disabled(!consent || !api.loggedIn || busy)
                    }
                }.navigationTitle("Revisa tu reporte").toolbar { Button("Cerrar") { reportSheet = false } }
            }
        }
        .alert("Certiva", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) { Button("Entendido") { errorMessage = nil } } message: { Text(errorMessage ?? "") }
    }
    private var loginFields: some View {
        Group {
            TextField("Usuario", text: $username).textContentType(.username).textInputAutocapitalization(.never).autocorrectionDisabled()
            SecureField("Contraseña", text: $password).textContentType(.password)
            Button("Entrar") { Task { busy = true; do { try await api.login(username: username, password: password); password = ""; await loadCases() } catch { errorMessage = error.localizedDescription }; busy = false } }.disabled(busy || password.isEmpty)
            Text("El servidor de pruebas debe estar activo en el Mac. Usa el acceso local de cliente asignado por el administrador.").font(.caption)
        }
    }
    private func analyze() {
        do { assessment = try engine?.assess(text: text, channel: channel, source: source, readingConfirmed: readingConfirmed); caseID = nil }
        catch { errorMessage = error.localizedDescription }
    }
    private func sendReport() async {
        guard let result = assessment else { return }; busy = true
        do {
            let data = try await api.request("api/cases", method: "POST", body: result.reportPayload(consent: consent))
            let item = try JSONDecoder().decode(PilotCase.self, from: data); caseID = item.id; reportSheet = false; await loadCases()
        } catch { errorMessage = error.localizedDescription }
        busy = false
    }
    private func loadCases() async {
        do { cases = try JSONDecoder().decode(CaseList.self, from: await api.request("api/cases")).cases }
        catch { errorMessage = error.localizedDescription }
    }
}
