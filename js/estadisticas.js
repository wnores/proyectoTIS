// js/estadisticas.js
import { db } from "./firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// =====================================================
// CARGAR ESTADÍSTICAS
// =====================================================
export async function cargarEstadisticas() {
    try {
        const [usuarios, cursos, adquisiciones, solicitudes] = await Promise.all([
            obtenerColeccion("usuarios"),
            obtenerColeccion("cursoscc"),
            obtenerColeccion("adquisiciones"),
            obtenerColeccion("solicitudesBecas")
        ]);

        // =====================================================
        // USUARIOS
        // =====================================================
        const totalUsuarios = usuarios.length;
        const usuariosActivos = usuarios.filter(u => u.activo !== false).length;

        const usuariosPorRol = usuarios.reduce((acc, u) => {
            const rol = (u.tipoUsuario || u.rol || "estudiante").toLowerCase().trim();
            acc[rol] = (acc[rol] || 0) + 1;
            return acc;
        }, {});

        // =====================================================
        // ADQUISICIONES (ventas y becas)
        // =====================================================
        const adquisicionesAprobadas = adquisiciones.filter(a => a.estado === "aprobada");

        // Estudiantes matriculados = con al menos 1 curso aprobado
        const uidsConCurso = new Set(adquisicionesAprobadas.map(a => a.usuarioId));
        const estudiantesMatriculados = uidsConCurso.size;

        // Ingresos totales (solo pagos, no becas)
        const ingresos = adquisicionesAprobadas.reduce((sum, a) => {
            return sum + (Number(a.precio) || 0);
        }, 0);

        // =====================================================
        // CURSOS
        // =====================================================
        const totalCursos = cursos.length;

        // Ranking de cursos por cantidad de adquisiciones
        const conteoPorCurso = {};
        adquisicionesAprobadas.forEach(a => {
            const id = a.cursoId;
            if (!id) return;
            conteoPorCurso[id] = (conteoPorCurso[id] || 0) + 1;
        });

        const ranking = Object.entries(conteoPorCurso)
            .map(([cursoId, cantidad]) => {
                const curso = cursos.find(c => c.id === cursoId);
                return {
                    id: cursoId,
                    titulo: curso?.titulo || curso?.nombre || "Curso sin nombre",
                    cantidad
                };
            })
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5); // Top 5

        // =====================================================
        // BECAS
        // =====================================================
        const becasOtorgadas = solicitudes.filter(s =>
            s.estado === "aprobada" || s.estado === "otorgada"
        ).length;

        // =====================================================
        // MOSTRAR EN EL DOM
        // =====================================================
        document.querySelector("#statTotalUsuarios").textContent = totalUsuarios;
        document.querySelector("#statUsuariosActivos").textContent = usuariosActivos;
        document.querySelector("#statMatriculados").textContent = estudiantesMatriculados;
        document.querySelector("#statTotalCursos").textContent = totalCursos;
        document.querySelector("#statIngresos").textContent = `$${ingresos.toLocaleString("es-UY")}`;
        document.querySelector("#statBecas").textContent = becasOtorgadas;

        renderizarRanking(ranking);
        renderizarDistribucionRoles(usuariosPorRol, totalUsuarios);

    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
    }
}

// =====================================================
// HELPERS
// =====================================================
async function obtenerColeccion(nombre) {
    const ref = collection(db, nombre);
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderizarRanking(ranking) {
    const contenedor = document.querySelector("#statRankingCursos");

    if (ranking.length === 0) {
        contenedor.innerHTML = `
            <p class="text-secondary text-center mb-0 py-3">
                Todavía no hay inscripciones.
            </p>
        `;
        return;
    }

    const maximo = Math.max(...ranking.map(r => r.cantidad));

    contenedor.innerHTML = ranking.map((curso, i) => {
        const porcentaje = Math.round((curso.cantidad / maximo) * 100);
        const medallas = ["🥇", "🥈", "🥉"];
        const icono = medallas[i] || `<span class="badge text-bg-light border">${i + 1}</span>`;

        return `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-semibold small">
                        ${icono} ${curso.titulo}
                    </span>
                    <span class="badge text-bg-primary">${curso.cantidad}</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-primary"
                         style="width: ${porcentaje}%"
                         role="progressbar"
                         aria-valuenow="${porcentaje}"
                         aria-valuemin="0"
                         aria-valuemax="100"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderizarDistribucionRoles(roles, total) {
    const contenedor = document.querySelector("#statDistribucionRoles");

    if (total === 0) {
        contenedor.innerHTML = `
            <p class="text-secondary text-center mb-0 py-3">
                No hay usuarios registrados.
            </p>
        `;
        return;
    }

    const colores = {
        estudiante: "success",
        docente: "info",
        admin: "danger",
        "docente/admin": "warning"
    };

    contenedor.innerHTML = Object.entries(roles)
        .sort((a, b) => b[1] - a[1])
        .map(([rol, cantidad]) => {
            const porcentaje = Math.round((cantidad / total) * 100);
            const color = colores[rol] || "secondary";

            return `
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-semibold small text-capitalize">${rol}</span>
                        <span>
                            <span class="badge text-bg-${color}">${cantidad}</span>
                            <small class="text-secondary ms-1">${porcentaje}%</small>
                        </span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-${color}"
                             style="width: ${porcentaje}%"></div>
                    </div>
                </div>
            `;
        }).join("");
}