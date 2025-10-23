import useAuthStore from "@/stores/authStore"
import { /* Carousel, */ Card, Row, Col, Statistic, Typography } from "antd"
import { /* UsergroupAddOutlined, DollarCircleOutlined, BarChartOutlined, */ ShopOutlined } from "@ant-design/icons"
import { EnvironmentOutlined, PhoneOutlined, MailOutlined/* , FileTextOutlined, AimOutlined, HomeOutlined */ } from "@ant-design/icons"
import { EUsuarioRolValues } from "@/enums"

const { Title, Text } = Typography

const InicioPage = () => {
	const usuario = useAuthStore((state) => state.usuario)

	/* const carouselImages = [
		{
			src: "/assets/ofertas.jpg",
			alt: "Super Ofertas - No te pierdas estos precios de locura",
			title: "Super Ofertas"
		},
		{
			src: "/assets/presencia.jpg", 
			alt: "Presencia en tu ciudad",
			title: "Estamos cerca de ti"
		},
		{
			src: "/assets/cotizar.jpg",
			alt: "Cotiza con nosotros",
			title: "Cotiza fácil y rápido"
		}
	] */

	const getSucursalInfo = () => {
		if (usuario?.sucursal) {
			return {
				nombre: usuario.sucursal.nombre,
				direccion: usuario.sucursal.direccion,
				telefono: usuario.sucursal.telefono,
				email: usuario.sucursal.email
			}
		}
		return {
			nombre: "Oficina Principal",
			direccion: "Dirección no disponible",
			telefono: "Teléfono no disponible", 
			email: "Email no disponible"
		}
	}

	const sucursalInfo = getSucursalInfo()

	return (
		<div className="space-y-6">
			{/* Bienvenida */}
			<div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
				<Title level={2} className="!text-white !mb-2">
					¡Bienvenido, {usuario?.nombre_completo}!
				</Title>
				<Text className="text-blue-100 text-lg">
					Gestiona eficientemente las operaciones en el Centro de Acopio
				</Text>
			</div>

			{/* Información de la sucursal */}
			<Row gutter={[16, 16]}>
				<Col xs={24} lg={16}>
					<Card title="Información de tu Sucursal" className="shadow-md h-full">
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
							<ShopOutlined className="text-blue-500 text-xl" />
								<div>
									<Text strong>Sucursal:</Text>
									<Text className="ml-2">{sucursalInfo.nombre}</Text>
								</div>
							</div>
							
							<div className="flex items-center space-x-3">
							<EnvironmentOutlined className="text-red-500 text-xl" />
								<div>
									<Text strong>Dirección:</Text>
									<Text className="ml-2">{sucursalInfo.direccion}</Text>
								</div>
							</div>
							
							<div className="flex items-center space-x-3">
							<PhoneOutlined className="text-green-500 text-xl" />
								<div>
									<Text strong>Teléfono:</Text>
									<Text className="ml-2">{sucursalInfo.telefono}</Text>
								</div>
							</div>
							
							<div className="flex items-center space-x-3">
							<MailOutlined className="text-purple-500 text-xl" />
								<div>
									<Text strong>Email:</Text>
									<Text className="ml-2">{sucursalInfo.email}</Text>
								</div>
							</div>
						</div>
					</Card>
				</Col>
				
				<Col xs={24} lg={8}>
					<div className="space-y-4">
						<Card className="shadow-md">
							<Statistic
								title="Estado de la sucursal"
								value={usuario?.sucursal?.activo ? "Activa" : "Inactiva"}
								valueStyle={{ 
									color: usuario?.sucursal?.activo ? '#3f8600' : '#cf1322' 
								}}
							/>
						</Card>
						
						<Card className="shadow-md">
							<Statistic
								title="Tu rol"
								value={usuario?.rol === EUsuarioRolValues.ADMINISTRADOR ? 'Administrador' : 
									   usuario?.rol === EUsuarioRolValues.SUPERVISOR ? 'Supervisor' : 
									   usuario?.rol === EUsuarioRolValues.SUPERADMINISTRADOR ? 'Superadministrador' : 'Usuario'}
								valueStyle={{ color: '#1890ff' }}
							/>
						</Card>
					</div>
				</Col>
			</Row>
			
			
			{/* <Row gutter={[24, 24]} align="top">
				<Col xs={24} lg={6}>
					<Card title="Estructura Organizacional" className="shadow-md h-full">
						<div className="space-y-4">
							<Card
								hoverable
								className="text-center bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer"
								onClick={() => window.open('/assets/ESTRUCTURA-Y-REGLAMENTO.pdf', '_blank')}
							>
								<FileTextOutlined className="text-2xl text-red-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Estructura y Reglamento</Text>
							</Card>
							
							<Card
								hoverable
								className="text-center bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer"
								onClick={() => window.open('/assets/MISION-VISION.pdf', '_blank')}
							>
								<AimOutlined className="text-2xl text-blue-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Misión y Visión</Text>
							</Card>
							
							<Card
								hoverable
								className="text-center bg-orange-50 border-orange-200 hover:bg-orange-100 cursor-pointer"
								onClick={() => window.open('/assets/ORGANIGRAMA.pdf', '_blank')}
							>
								<HomeOutlined className="text-2xl text-orange-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Organigrama</Text>
							</Card>
						</div>
					</Card>
				</Col>
				
				<Col xs={24} lg={12}>
					<Card className="shadow-md h-full">
						<div className="flex flex-col items-center justify-start min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8">
							
							<div className="text-center mb-8">
								<img 
									src="/assets/logo.png" 
									alt="CrediInversiones Logo" 
									className="max-w-[200px] max-h-[200px] object-contain mx-auto"
								/>
							</div>
							
							<div className="text-center mb-8">
								<Title level={3} style={{ color: '#354B98' }} className="!mb-4">
									MISIÓN
								</Title>
								<Text className="text-gray-700 text-base leading-relaxed">
									Aqui va la misión.
								</Text>
							</div>
							
							<div className="text-center">
								<Title level={3} style={{ color: '#354B98' }} className="!mb-4">
									VISIÓN
								</Title>
								<Text className="text-gray-700 text-base leading-relaxed">
									Aqui va la visión.
								</Text>
							</div>
						</div>
					</Card>
				</Col>
				
				<Col xs={24} lg={6}>
					<Card title="Accesos Rápidos" className="shadow-md h-full">
						<div className="space-y-4">
							<Card
								hoverable
								className="text-center bg-blue-50 border-blue-200 hover:bg-blue-100"
							>
								<ShopOutlined className="text-2xl text-blue-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Inicio</Text>
							</Card>
							
							<Card
								hoverable
								className="text-center bg-green-50 border-green-200 hover:bg-green-100"
							>
								<UsergroupAddOutlined className="text-2xl text-green-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Clientes</Text>
							</Card>
							
							<Card
								hoverable
								className="text-center bg-purple-50 border-purple-200 hover:bg-purple-100"
							>
								<DollarCircleOutlined className="text-2xl text-purple-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Usuarios</Text>
							</Card>
							
							<Card
								hoverable
								className="text-center bg-orange-50 border-orange-200 hover:bg-orange-100"
							>
								<BarChartOutlined className="text-2xl text-orange-500 mb-2 mx-auto" />
								<Text strong className="text-sm">Reportes</Text>
							</Card>
						</div>
					</Card>
				</Col>
			</Row> */}

			{/* Carrusel de imágenes */}
			{/* <Card title="Nuestras Promociones" className="shadow-md">
				<div className="max-w-4xl mx-auto">
					<Carousel autoplay dotPosition="bottom" className="rounded-lg overflow-hidden">
						{carouselImages.map((image, index) => (
							<div key={index} className="relative">
								<img
									src={image.src}
									alt={image.alt}
									className="w-full h-[400px] sm:h-[500px] md:h-[600px] object-contain bg-gray-100"
								/>
								<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
									<Title level={4} className="!text-white !mb-0">
										{image.title}
									</Title>
								</div>
							</div>
						))}
					</Carousel>
				</div>
			</Card> */}
		</div>
	)
}

export default InicioPage
