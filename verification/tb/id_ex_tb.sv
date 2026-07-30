`timescale 1ns / 1ps

module id_ex_tb;

logic clk;
logic reset;
logic enable;

logic [31:0] pc_in;
logic [31:0] read_data1_in;
logic [31:0] read_data2_in;
logic [31:0] immediate_in;

logic [4:0] rs1_in;
logic [4:0] rs2_in;
logic [4:0] rd_in;

logic RegWrite_in;
logic MemRead_in;
logic MemWrite_in;
logic MemtoReg_in;
logic ALUSrc_in;
logic Branch_in;
logic Jump_in;

logic [3:0] alu_control_in;

logic [31:0] pc_out;
logic [31:0] read_data1_out;
logic [31:0] read_data2_out;
logic [31:0] immediate_out;

logic [4:0] rs1_out;
logic [4:0] rs2_out;
logic [4:0] rd_out;

logic RegWrite_out;
logic MemRead_out;
logic MemWrite_out;
logic MemtoReg_out;
logic ALUSrc_out;
logic Branch_out;
logic Jump_out;

logic [3:0] alu_control_out;

id_ex dut(

    .*

);

initial begin
    clk = 0;
    forever #5 clk = ~clk;
end

initial begin

    reset = 1;
    enable = 1;

    #15;

    reset = 0;

    pc_in = 32'h4;
    read_data1_in = 32'd10;
    read_data2_in = 32'd20;
    immediate_in = 32'd100;

    rs1_in = 5'd1;
    rs2_in = 5'd2;
    rd_in = 5'd3;

    RegWrite_in = 1;
    MemRead_in = 0;
    MemWrite_in = 0;
    MemtoReg_in = 0;
    ALUSrc_in = 1;
    Branch_in = 0;
    Jump_in = 0;

    alu_control_in = 4'b0000;

    #10;

    $display("----------------------------------");
    $display("ID/EX Register Test");
    $display("----------------------------------");
    $display("PC         = %h", pc_out);
    $display("Read1      = %d", read_data1_out);
    $display("Read2      = %d", read_data2_out);
    $display("Immediate  = %d", immediate_out);
    $display("RD         = %d", rd_out);
    $display("ALU Ctrl   = %b", alu_control_out);
    $display("----------------------------------");

    $finish;

end

endmodule